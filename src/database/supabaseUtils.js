import { supabase } from './supabaseConfig';

// Export the supabase instance for direct use
export { supabase };

const mapUserRecord = (record) => {
  if (!record || typeof record !== 'object') return record;
  const {
    authstatus,
    referral_count,
    referral_bonus_total,
    referral_code,
    referral_code_expires_at,
    referral_code_issued_at,
    referred_by_code,
    referral_level,
    ...rest
  } = record;
  return {
    ...rest,
    authStatus: authstatus ?? rest.authStatus ?? null,
    referralCount: referral_count ?? rest.referralCount ?? 0,
    referralBonusTotal: referral_bonus_total ?? rest.referralBonusTotal ?? 0,
    referralCode: referral_code ?? rest.referralCode ?? null,
    referralCodeExpiresAt: referral_code_expires_at ?? rest.referralCodeExpiresAt ?? null,
    referralCodeIssuedAt: referral_code_issued_at ?? rest.referralCodeIssuedAt ?? null,
    referredByCode: referred_by_code ?? rest.referredByCode ?? null,
    referralLevel: referral_level ?? rest.referralLevel ?? 0,
  };
};

const mapInvestmentRecord = (record) => {
  if (!record || typeof record !== 'object') return record;
  const { paymentoption, authstatus, ...rest } = record;
  return {
    ...rest,
    paymentOption: paymentoption ?? record.paymentOption ?? 'Bitcoin',
    authStatus: authstatus ?? record.authStatus ?? 'unseen',
  };
};

const normalizeInvestmentPayload = (investmentData = {}) => ({
  idnum: investmentData.idnum,
  plan: investmentData.plan,
  status: investmentData.status || 'pending',
  capital: investmentData.capital ?? 0,
  roi: investmentData.roi ?? 0,
  bonus: investmentData.bonus ?? 0,
  duration: investmentData.duration ?? 5,
  paymentoption: investmentData.paymentOption ?? investmentData.paymentoption ?? 'Bitcoin',
  authstatus: investmentData.authStatus ?? investmentData.authstatus ?? 'unseen',
  credited_roi: investmentData.credited_roi ?? 0,
  credited_bonus: investmentData.credited_bonus ?? 0,
});

// Referral helpers
const REFERRAL_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const REFERRAL_CODE_LENGTH = 8;
const REFERRAL_CODE_RETRY_LIMIT = 12;
const REFERRAL_DEFAULT_EXPIRATION_DAYS = 30;
const REFERRAL_MAX_LEVEL = 3;

const addDaysToNow = (days) => {
  const base = new Date();
  base.setUTCDate(base.getUTCDate() + (Number.isFinite(days) ? days : REFERRAL_DEFAULT_EXPIRATION_DAYS));
  return base.toISOString();
};

const randomReferralCode = (seed = '') => {
  const sanitizedSeed = (seed || '')
    .replace(/[^A-Z0-9]/gi, '')
    .toUpperCase();
  const prefix = sanitizedSeed.slice(0, 2).padEnd(2, 'G');
  let output = prefix;

  while (output.length < REFERRAL_CODE_LENGTH) {
    const index = Math.floor(Math.random() * REFERRAL_CODE_ALPHABET.length);
    output += REFERRAL_CODE_ALPHABET[index];
  }

  return output;
};

const fetchUserlogRecord = async ({ userId, userIdnum }) => {
  if (!userId && !userIdnum) {
    throw new Error('User identifier is required for referral operations');
  }

  const query = supabase
    .from('userlogs')
    .select('*')
    .limit(1);

  if (userId) {
    query.eq('id', userId);
  } else if (userIdnum) {
    query.eq('idnum', userIdnum);
  }

  const { data, error } = await query.single();
  if (error) throw error;
  return data;
};

const referralCodeExists = async (code) => {
  const { data, error } = await supabase
    .from('userlogs')
    .select('id')
    .eq('referral_code', code)
    .limit(1);

  if (error) throw error;
  return Array.isArray(data) && data.length > 0;
};

const fetchLatestReferralRecordForUser = async (idnum) => {
  if (!idnum) return null;
  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('referred_idnum', idnum)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data || null;
};

const refreshReferralAggregates = async (referrerIdnum) => {
  if (!referrerIdnum) return { referralCount: 0, referralBonusTotal: 0 };

  const { count: referralCount, error: countError } = await supabase
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_idnum', referrerIdnum);

  if (countError) throw countError;

  const { data: rewardRows, error: rewardError } = await supabase
    .from('referral_rewards')
    .select('reward_amount, bonus_amount')
    .eq('referrer_idnum', referrerIdnum);

  if (rewardError) throw rewardError;

  const referralBonusTotal = (rewardRows || []).reduce((sum, row) => {
    const rewardAmount = Number.parseFloat(row?.reward_amount) || 0;
    const bonusAmount = Number.parseFloat(row?.bonus_amount) || 0;
    return sum + rewardAmount + bonusAmount;
  }, 0);

  const { error: updateError } = await supabase
    .from('userlogs')
    .update({
      referral_count: referralCount || 0,
      referral_bonus_total: Number(referralBonusTotal.toFixed(2)),
      updated_at: new Date().toISOString()
    })
    .eq('idnum', referrerIdnum);

  if (updateError) throw updateError;

  return {
    referralCount: referralCount || 0,
    referralBonusTotal: Number(referralBonusTotal.toFixed(2))
  };
};

const ensureReferralCodeForUser = async ({
  userRecord,
  userId,
  userIdnum,
  seed,
  force = false,
  expirationDays
} = {}) => {
  let record = userRecord;
  if (!record) {
    record = await fetchUserlogRecord({ userId, userIdnum });
  }

  if (!record) {
    throw new Error('Unable to locate user for referral code generation');
  }

  if (!force && record.referral_code) {
    return { data: mapUserRecord(record), error: null };
  }

  let attempts = 0;
  let nextCode = null;

  while (attempts < REFERRAL_CODE_RETRY_LIMIT) {
    nextCode = randomReferralCode(seed || record.email || record.name || 'GRANT');
    const exists = await referralCodeExists(nextCode);
    if (!exists) break;
    attempts += 1;
    nextCode = null;
  }

  if (!nextCode) {
    throw new Error('Unable to generate a unique referral code after multiple attempts');
  }

  const issuedAt = new Date().toISOString();
  const expiresAt = addDaysToNow(expirationDays || REFERRAL_DEFAULT_EXPIRATION_DAYS);

  const { data, error } = await supabase
    .from('userlogs')
    .update({
      referral_code: nextCode,
      referral_code_issued_at: issuedAt,
      referral_code_expires_at: expiresAt,
      updated_at: issuedAt
    })
    .eq('id', record.id)
    .select()
    .single();

  if (error) {
    return { data: null, error };
  }

  return { data: mapUserRecord(data), error: null };
};

const linkReferralToUser = async ({
  referralCode,
  referredUserId,
  metadata = {},
  expiresInDays,
  allowOverwrite = false
} = {}) => {
  if (!referralCode || !referredUserId) {
    throw new Error('Referral code and referred user are both required');
  }

  const normalizedCode = referralCode.trim().toUpperCase();

  const { data: referrer, error: referrerError } = await supabase
    .from('userlogs')
    .select('*')
    .eq('referral_code', normalizedCode)
    .single();

  if (referrerError || !referrer) {
    throw new Error('Referral code not found');
  }

  const { data: referred, error: referredError } = await supabase
    .from('userlogs')
    .select('*')
    .eq('id', referredUserId)
    .single();

  if (referredError || !referred) {
    throw new Error('Unable to locate the referred user');
  }

  if (referrer.id === referred.id) {
    throw new Error('Users cannot refer themselves');
  }

  if (referred.referred_by_idnum && !allowOverwrite) {
    throw new Error('User is already linked to a referrer');
  }

  const parentReferral = await fetchLatestReferralRecordForUser(referrer.idnum);
  const calculatedLevel = parentReferral ? Math.min(parentReferral.level + 1, REFERRAL_MAX_LEVEL) : 1;
  const expiresAt = expiresInDays ? addDaysToNow(expiresInDays) : (referrer.referral_code_expires_at || addDaysToNow(REFERRAL_DEFAULT_EXPIRATION_DAYS));

  const { data: referralRow, error: referralError } = await supabase
    .from('referrals')
    .insert([{
      referral_code: normalizedCode,
      referrer_id: referrer.id,
      referrer_idnum: referrer.idnum,
      referred_user_id: referred.id,
      referred_idnum: referred.idnum,
      parent_referral_id: parentReferral?.id || null,
      level: calculatedLevel,
      status: 'pending',
      expires_at: expiresAt,
      metadata,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (referralError) {
    return { data: null, error: referralError };
  }

  const { error: referredUpdateError } = await supabase
    .from('userlogs')
    .update({
      referred_by_code: normalizedCode,
      referred_by_idnum: referrer.idnum,
      referral_level: calculatedLevel,
      referral_code_expires_at: referralRow?.expires_at || referred.referral_code_expires_at,
      updated_at: new Date().toISOString()
    })
    .eq('id', referred.id);

  if (referredUpdateError) {
    return { data: referralRow, error: referredUpdateError };
  }

  try {
    await refreshReferralAggregates(referrer.idnum);
  } catch (aggregateError) {
    console.error('Failed to refresh referral aggregates', aggregateError);
  }

  return { data: referralRow, error: null };
};

const getReferralStats = async (referrerIdnum) => {
  if (!referrerIdnum) {
    return { data: null, error: new Error('Referrer idnum is required for stats') };
  }

  const { data: referralRows, error: referralError } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_idnum', referrerIdnum)
    .order('created_at', { ascending: false });

  if (referralError) {
    return { data: null, error: referralError };
  }

  const totalReferrals = referralRows?.length || 0;
  const directCount = (referralRows || []).filter((row) => row.level === 1).length;
  const indirectCount = totalReferrals - directCount;

  const { data: rewardRows, error: rewardError } = await supabase
    .from('referral_rewards')
    .select('reward_amount, bonus_amount, status')
    .eq('referrer_idnum', referrerIdnum);

  if (rewardError) {
    return { data: null, error: rewardError };
  }

  const totalRewards = (rewardRows || []).reduce((sum, row) => {
    const rewardAmount = Number.parseFloat(row?.reward_amount) || 0;
    const bonusAmount = Number.parseFloat(row?.bonus_amount) || 0;
    return sum + rewardAmount + bonusAmount;
  }, 0);

  const pendingRewards = (rewardRows || []).filter((row) => row.status !== 'paid').length;

  return {
    data: {
      referralCount: totalReferrals,
      directCount,
      indirectCount,
      totalRewards: Number(totalRewards.toFixed(2)),
      pendingRewards,
      recentReferrals: (referralRows || []).slice(0, 5)
    },
    error: null
  };
};

export const referralService = {
  generateReferralCode: randomReferralCode,
  ensureReferralCodeForUser,
  linkReferralToUser,
  refreshReferralAggregates,
  getReferralStats
};

// Progressive login delay system for account protection
let loginAttempts = {};
const MAX_ATTEMPTS = 5;
const BASE_DELAY = 1000; // 1 second

const getLoginDelay = (email) => {
  const attempts = loginAttempts[email] || 0;
  if (attempts < 3) return 0; // No delay for first 3 attempts
  return BASE_DELAY * Math.pow(2, attempts - 3); // Exponential backoff
};

const recordFailedAttempt = (email) => {
  loginAttempts[email] = (loginAttempts[email] || 0) + 1;

  // Clear attempts after 30 minutes
  setTimeout(() => {
    if (loginAttempts[email]) {
      delete loginAttempts[email];
    }
  }, 30 * 60 * 1000);
};

const resetLoginAttempts = (email) => {
  delete loginAttempts[email];
};

// Authentication functions
export const supabaseAuth = {
  signIn: async (email, password) => {
    // Check for progressive delay
    const delay = getLoginDelay(email);
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      recordFailedAttempt(email);
      return { data, error };
    } else {
      resetLoginAttempts(email);
      return { data, error };
    }
  },

  signUp: async (email, password, userData = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  setSession: async (accessToken, refreshToken) => {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    return { data, error };
  },

  resetPassword: async (email, redirectTo) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || `${window.location.origin}/reset-password`
    });
    return { error };
  },

  updatePassword: async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    return { data, error };
  },

  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Database functions
export const supabaseDb = {
  // User operations
  getUserByEmail: async (email) => {
    const { data, error } = await supabase
      .from('userlogs')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();
    return { data: mapUserRecord(data), error };
  },

  getUserById: async (id) => {
    const { data, error } = await supabase
      .from('userlogs')
      .select('*')
      .eq('id', id)
      .single();
    return { data: mapUserRecord(data), error };
  },

  getUserByIdnum: async (idnum) => {
    const { data, error } = await supabase
      .from('userlogs')
      .select('*')
      .eq('idnum', idnum)
      .single();
    return { data: mapUserRecord(data), error };
  },

  getAllUsers: async () => {
    const { data, error } = await supabase
      .from('userlogs')
      .select('*')
      .order('created_at', { ascending: false });
    return { data: data?.map(mapUserRecord) || [], error };
  },

  updateUser: async (id, updates = {}) => {
    const { authStatus, authstatus, ...rest } = updates;
    const payload = {
      ...rest,
      updated_at: new Date().toISOString()
    };
    const derivedStatus = authStatus ?? authstatus;
    if (typeof derivedStatus !== 'undefined') {
      payload.authstatus = derivedStatus;
    }

    const { data, error } = await supabase
      .from('userlogs')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    return { data: mapUserRecord(data), error };
  },

  updateUserDetails: async (id, updates = {}) => {
    const { authStatus, authstatus, ...rest } = updates;
    const payload = {
      ...rest,
      updated_at: new Date().toISOString()
    };
    const derivedStatus = authStatus ?? authstatus;
    if (typeof derivedStatus !== 'undefined') {
      payload.authstatus = derivedStatus;
    }

    const { data, error } = await supabase
      .from('userlogs')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    return { data: mapUserRecord(data), error };
  },

  addFundsToUser: async (userId, { balance: addBalance, bonus: addBonus, modifiedBy }) => {
    // First get current user data
    const { data: userData, error: fetchError } = await supabase
      .from('userlogs')
      .select('balance, bonus, idnum')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    const currentBalance = parseFloat(userData.balance) || 0;
    const currentBonus = parseFloat(userData.bonus) || 0;
    const deltaBalance = parseFloat(addBalance) || 0;
    const deltaBonus = parseFloat(addBonus) || 0;
    const modifiedAt = new Date().toISOString();

    // Update user balance and bonus
    const { data, error } = await supabase
      .from('userlogs')
      .update({
        balance: currentBalance + deltaBalance,
        bonus: currentBonus + deltaBonus,
        authstatus: 'seen',
        updated_at: modifiedAt
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Create notification for the user
    await supabase
      .from('notifications')
      .insert([{
        idnum: userData.idnum,
        type: 'balance_update',
        title: 'Account Balance Updated',
        message: `Your account has been credited with $${deltaBalance.toLocaleString()} balance and $${deltaBonus.toLocaleString()} bonus.`,
        status: 'unseen',
        created_at: modifiedAt,
        updated_at: modifiedAt
      }]);

    return { data: mapUserRecord(data), error: null };
  },

  deleteUser: async (id) => {
    const { data, error } = await supabase
      .from('userlogs')
      .delete()
      .eq('id', id);
    return { data, error };
  },

  createUser: async (userData = {}) => {
    const {
      authStatus,
      authstatus,
      referralCode,
      referral_code,
      referralCodeUsed,
      referrerCode,
      referredByCode,
      ...rest
    } = userData;

    const normalizedReferralCodeUsed = (referralCodeUsed || referrerCode || referredByCode || '').trim().toUpperCase() || null;
    const explicitReferralCode = (referralCode || referral_code || '').trim().toUpperCase() || null;

    const timestamp = new Date().toISOString();
    const payload = {
      ...rest,
      authstatus: authStatus ?? authstatus ?? 'unseen',
      referral_code: explicitReferralCode || rest.referral_code || null,
      created_at: timestamp,
      updated_at: timestamp
    };

    const { data, error } = await supabase
      .from('userlogs')
      .insert([payload])
      .select()
      .single();

    if (error || !data) {
      return { data: mapUserRecord(data), error };
    }

    const referralTasks = [];

    if (!data.referral_code) {
      referralTasks.push(
        referralService.ensureReferralCodeForUser({ userRecord: data }).catch((referralError) => {
          console.error('Failed to ensure referral code for user', referralError);
        })
      );
    }

    if (normalizedReferralCodeUsed) {
      referralTasks.push(
        referralService.linkReferralToUser({
          referralCode: normalizedReferralCodeUsed,
          referredUserId: data.id,
          metadata: { source: 'createUser' }
        }).catch((referralLinkError) => {
          console.error('Failed to link referral to user', referralLinkError);
        })
      );
    }

    if (referralTasks.length) {
      await Promise.allSettled(referralTasks);
    }

    const { data: refreshedUser, error: refreshError } = await supabase
      .from('userlogs')
      .select('*')
      .eq('id', data.id)
      .single();

    return { data: mapUserRecord(refreshedUser || data), error: refreshError || null };
  },

  getAdminUser: async () => {
    const { data, error } = await supabase
      .from('userlogs')
      .select('*')
      .eq('admin', true)
      .eq('name', 'admin')
      .single();
    return { data: mapUserRecord(data), error };
  },

  // Investment operations
  getInvestmentsByIdnum: async (idnum) => {
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('idnum', idnum)
      .order('created_at', { ascending: false });
    return { data: data?.map(mapInvestmentRecord) || [], error };
  },

  getAllInvestments: async () => {
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .order('created_at', { ascending: false });
    return { data: data?.map(mapInvestmentRecord) || [], error };
  },

  createInvestment: async (investmentData) => {
    const cleanData = normalizeInvestmentPayload(investmentData);

    console.log('Creating investment with data:', cleanData);

    const { data, error } = await supabase
      .from('investments')
      .insert([cleanData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating investment:', error);
    }

    return { data: mapInvestmentRecord(data), error };
  },

  deleteInvestmentsByUserId: async (userId) => {
    const { data, error } = await supabase
      .from('investments')
      .delete()
      .eq('id', userId);
    return { data, error };
  },

  updateInvestment: async (id, updates) => {
    const { paymentOption, paymentoption, authStatus, authstatus, ...rest } = updates || {};
    const payload = {
      ...rest,
      updated_at: new Date().toISOString()
    };
    const derivedPaymentOption = paymentOption ?? paymentoption;
    if (typeof derivedPaymentOption !== 'undefined') {
      payload.paymentoption = derivedPaymentOption;
    }
    const derivedAuthStatus = authStatus ?? authstatus;
    if (typeof derivedAuthStatus !== 'undefined') {
      payload.authstatus = derivedAuthStatus;
    }

    const { data, error } = await supabase
      .from('investments')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    return { data: mapInvestmentRecord(data), error };
  },

  activateInvestment: async (investmentId, {
    approvedBy,
    capital = 0,
    roi = 0,
    bonus = 0,
    idnum,
    creditBonus = false
  }) => {
    const approvedAt = new Date().toISOString();
    const toNumber = (value) => {
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const capitalAmount = toNumber(capital);
    const roiAmount = toNumber(roi);
    const bonusAmount = toNumber(bonus);

    // Update investment status and payout targets
    const { data: investmentData, error: investError } = await supabase
      .from('investments')
      .update({
        status: 'Active',
        roi: roiAmount,
        bonus: bonusAmount,
        credited_roi: 0,
        credited_bonus: 0,
        approved_at: approvedAt,
        authstatus: 'seen',
        approved_by: approvedBy || null,
        updated_at: approvedAt
      })
      .eq('id', investmentId)
      .select()
      .single();

    if (investError) {
      console.error('activateInvestment: investment update failed', investError);
      throw investError;
    }

    // Get user and update balance/bonus
    const { data: userData, error: userFetchError } = await supabase
      .from('userlogs')
      .select('balance, bonus')
      .eq('idnum', idnum)
      .single();

    if (userFetchError) {
      console.error('activateInvestment: user fetch failed', userFetchError);
      throw userFetchError;
    }

    const currentBalance = parseFloat(userData.balance) || 0;
    const currentBonus = parseFloat(userData.bonus) || 0;

    const userUpdates = {
      balance: Number((currentBalance + capitalAmount).toFixed(2)),
      authstatus: 'seen',
      updated_at: approvedAt
    };

    if (creditBonus) {
      userUpdates.bonus = Number((currentBonus + bonusAmount).toFixed(2));
    }

    const { data: updatedUser, error: userUpdateError } = await supabase
      .from('userlogs')
      .update(userUpdates)
      .eq('idnum', idnum)
      .select()
      .single();

    if (userUpdateError) {
      console.error('activateInvestment: user update failed', userUpdateError);
      throw userUpdateError;
    }

    return { investmentData: mapInvestmentRecord(investmentData), updatedUser: mapUserRecord(updatedUser), error: null };
  },

  // Loan operations
  updateLoanStatus: async (loanId, { status, approvedBy, approvedByName }) => {
    const updatedAt = new Date().toISOString();

    // First get the loan data
    const { data: loanData, error: loanFetchError } = await supabase
      .from('loans')
      .select('*')
      .eq('id', loanId)
      .single();

    if (loanFetchError) throw loanFetchError;
    if (loanData.status === status) return { data: loanData, error: null };

    // Update loan status
    const { data: updatedLoan, error: loanUpdateError } = await supabase
      .from('loans')
      .update({
        status,
        updated_at: updatedAt,
        approved_by: approvedBy,
        approved_by_name: approvedByName
      })
      .eq('id', loanId)
      .select()
      .single();

    if (loanUpdateError) throw loanUpdateError;

    // If approving, credit user balance and bonus
    if (status === 'Approved') {
      if (!loanData.user_id) {
        throw new Error('Loan user_id missing. Cannot credit user.');
      }

      const { data: userData, error: userFetchError } = await supabase
        .from('userlogs')
        .select('balance, bonus')
        .eq('id', loanData.user_id)
        .single();

      if (userFetchError) throw userFetchError;

      const prevBalance = parseFloat(userData.balance) || 0;
      const prevBonus = parseFloat(userData.bonus) || 0;
      const creditAmount = parseFloat(loanData.amount) || 0;
      // Add 5% bonus on loan amount
      const bonusAmount = creditAmount * 0.05;

      const { data: updatedUser, error: userUpdateError } = await supabase
        .from('userlogs')
        .update({
          balance: prevBalance + creditAmount,
          bonus: prevBonus + bonusAmount,
          last_modified_by: approvedBy,
          last_modified_at: updatedAt,
          updated_at: updatedAt
        })
        .eq('id', loanData.user_id)
        .select()
        .single();

      if (userUpdateError) throw userUpdateError;
    }

    return { data: updatedLoan, error: null };
  },

  // Notification operations
  getNotificationsByIdnum: async (idnum) => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('idnum', idnum)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  createNotification: async (notificationData) => {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        ...notificationData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    return { data, error };
  },

  updateNotification: async (id, updates) => {
    const { data, error } = await supabase
      .from('notifications')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  // KYC operations
  createKYC: async (kycData) => {
    const { data, error } = await supabase
      .from('kyc')
      .insert([{
        ...kycData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    return { data, error };
  },

  getKYCByUserId: async (userId) => {
    const { data, error } = await supabase
      .from('kyc')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  getWithdrawalsByIdnum: async (idnum) => {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('idnum', idnum)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  createWithdrawalCode: async (codeData) => {
    const now = new Date();
    const createdAt = now.toISOString();
    const defaultExpiry = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

    const payload = {
      ...codeData,
      user_id: codeData?.user_id?.toString().trim(),
      code: codeData?.code?.toString().trim(),
      created_at: createdAt,
      updated_at: createdAt,
      expires_at: codeData?.expires_at || defaultExpiry,
      status: codeData?.status || 'active',
      used: typeof codeData?.used === 'boolean' ? codeData.used : false
    };

    if (!payload.user_id) {
      throw new Error('createWithdrawalCode requires a user_id. Provide an idnum or user UUID.');
    }

    if (!payload.code || payload.code.length !== 6) {
      throw new Error('createWithdrawalCode requires a 6-digit code.');
    }

    const { data, error } = await supabase
      .from('withdrawal_codes')
      .insert([payload])
      .select()
      .single();
    return { data, error };
  }
};

// Storage functions
export const supabaseStorage = {
  uploadFile: async (bucket, path, file) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);
    return { data, error };
  },

  getPublicUrl: (bucket, path) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return data.publicUrl;
  },

  deleteFile: async (bucket, path) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    return { data, error };
  },

  getAllWithdrawals: async () => {
    const { data, error } = await supabase
      .from('withdrawals')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  }
};

// Real-time subscriptions
export const supabaseRealtime = {
  subscribeToUser: (userId, callback) => {
    const channel = supabase
      .channel(`user-${userId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'userlogs',
          filter: `id=eq.${userId}`
        },
        callback
      );
    
    channel.subscribe();
    return channel;
  },

  subscribeToInvestments: (idnum, callback) => {
    const channel = supabase
      .channel(`investments-${idnum}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'investments',
          filter: `idnum=eq.${idnum}`
        },
        callback
      );
    
    channel.subscribe();
    return channel;
  },

  subscribeToNotifications: (idnum, callback) => {
    const channel = supabase
      .channel(`notifications-${idnum}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `idnum=eq.${idnum}`
        },
        callback
      );
    
    channel.subscribe();
    return channel;
  },

  subscribeToWithdrawals: (idnum, callback) => {
    const channel = supabase
      .channel(`withdrawals-${idnum}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawals',
          filter: `idnum=eq.${idnum}`
        },
        callback
      );
    
    channel.subscribe();
    return channel;
  },

  subscribeToLoans: (idnum, callback) => {
    const channel = supabase
      .channel(`loans-${idnum}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loans',
          filter: `idnum=eq.${idnum}`
        },
        callback
      );
    
    channel.subscribe();
    return channel;
  },

  // Chat operations
  addChatMessage: async (messageData) => {
    const { data, error } = await supabase
      .from('chats')
      .insert([{
        ...messageData,
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    return { data, error };
  },

  getChatMessages: async (userId) => {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: true });
    return { data, error };
  },

  subscribeToChatMessages: (userId, callback) => {
    const channel = supabase
      .channel(`chats-${userId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
          filter: `user_id=eq.${userId}`
        },
        callback
      );
    
    channel.subscribe();
    return channel;
  },

  getChatCounts: async (userId, isAdmin) => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('is_admin')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching chat counts:', error);
        return 0;
      }

      if (isAdmin) {
        // Admin sees count of user messages (non-admin messages)
        return data.filter(msg => !msg.is_admin).length;
      } else {
        // User sees count of admin messages
        return data.filter(msg => msg.is_admin).length;
      }
    } catch (err) {
      console.error('Chat counts error:', err);
      return 0;
    }
  },

  // Loan operations
  createLoan: async (loanData) => {
    const numberOrNull = (value) => {
      if (value === null || value === undefined || value === '') return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const stringOrNull = (value) => {
      if (value === null || value === undefined) return null;
      const trimmed = value.toString().trim();
      return trimmed.length ? trimmed : null;
    };

    const referencesPayload = {
      contacts: Array.isArray(loanData.references) ? loanData.references : [],
      emergencyContact: loanData.emergencyContact || null,
      dependents: loanData.dependents ?? null,
      preferredPaymentDate: loanData.preferredPaymentDate ?? null
    };

    const now = new Date().toISOString();
    const cleanLoanData = {
      idnum: loanData.idnum,
      user_id: loanData.user_id || null,
      user_name: stringOrNull(loanData.user_name) || stringOrNull(loanData.userName),
      amount: numberOrNull(loanData.amount),
      purpose: stringOrNull(loanData.purpose),
      employment_status: stringOrNull(loanData.employmentStatus),
      employer: stringOrNull(loanData.employer),
      monthly_income: numberOrNull(loanData.monthlyIncome),
      payment_frequency: loanData.paymentFrequency || 'Monthly',
      employment_duration: stringOrNull(loanData.employmentDuration),
      previous_loans: loanData.previousLoans || 'No',
      collateral: loanData.collateral || 'No',
      collateral_type: stringOrNull(loanData.collateralType),
      collateral_value: numberOrNull(loanData.collateralValue),
      credit_score: stringOrNull(loanData.creditScore),
      references: referencesPayload,
      bank_name: stringOrNull(loanData.bankName),
      account_number: stringOrNull(loanData.accountNumber),
      account_type: loanData.accountType || 'Savings',
      residential_status: loanData.residentialStatus || null,
      monthly_rent: numberOrNull(loanData.monthlyRent),
      residence_duration: stringOrNull(loanData.residenceDuration),
      status: loanData.status || 'Pending',
      interest_rate: numberOrNull(loanData.interestRate),
      duration: Number.isFinite(Number.parseInt(loanData.preferredDuration, 10))
        ? Number.parseInt(loanData.preferredDuration, 10)
        : numberOrNull(loanData.duration),
      created_at: now,
      updated_at: now
    };

    const { data, error } = await supabase
      .from('loans')
      .insert([cleanLoanData])
      .select()
      .single();
    return { data, error };
  },

  getLoansByIdnum: async (idnum) => {
    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .eq('idnum', idnum)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  updateLoan: async (id, updates) => {
    const { data, error } = await supabase
      .from('loans')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  // Withdrawal operations
  createWithdrawal: async (withdrawalData) => {
    const { data, error } = await supabase
      .from('withdrawals')
      .insert([{
        ...withdrawalData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    return { data, error };
  },

  deleteWithdrawalsByUserId: async (userId) => {
    const { data, error } = await supabase
      .from('withdrawals')
      .delete()
      .eq('user_id', userId);
    return { data, error };
  },

  updateWithdrawal: async (id, updates) => {
    const { data, error } = await supabase
      .from('withdrawals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return { data, error };
  },

  // Admin functions for all records
  subscribeToAllInvestments: (callback) => {
    const channel = supabase
      .channel('all-investments')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'investments'
        },
        callback
      );

    channel.subscribe();
    return channel;
  },

  subscribeToAllUsers: (callback) => {
    const channel = supabase
      .channel('all-users')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'userlogs'
        },
        callback
      );

    channel.subscribe();
    return channel;
  },

  subscribeToAllWithdrawals: (callback) => {
    const channel = supabase
      .channel('all-withdrawals')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawals'
        },
        callback
      );

    channel.subscribe();
    return channel;
  },

  // User-specific subscription functions
  subscribeToInvestments: (idnum, callback) => {
    const channel = supabase
      .channel(`user-investments-${idnum}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'investments',
          filter: `idnum=eq.${idnum}`
        },
        callback
      );

    channel.subscribe();
    return channel;
  },

  subscribeToNotifications: (idnum, callback) => {
    const channel = supabase
      .channel(`user-notifications-${idnum}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `idnum=eq.${idnum}`
        },
        callback
      );

    channel.subscribe();
    return channel;
  }
};
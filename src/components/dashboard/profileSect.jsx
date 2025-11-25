import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../database/supabaseConfig";
import { supabaseDb } from "../../database/supabaseUtils";
import profileStyles from "./Profile.module.css";

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Congo-Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia (Czech Republic)",
  "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini (fmr. 'Swaziland')", "Ethiopia",
  "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Holy See", "Honduras", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar (formerly Burma)",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
  "Oman",
  "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar",
  "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States of America", "Uruguay", "Uzbekistan",
  "Vanuatu", "Venezuela", "Vietnam",
  "Yemen",
  "Zambia", "Zimbabwe"
];

const buildProfileForm = (user = {}) => ({
  name: user?.name ?? "",
  userName: user?.userName ?? user?.user_name ?? "",
  phone: user?.phone ?? user?.phoneNumber ?? user?.phone_number ?? user?.mobile ?? "",
  country: user?.country ?? user?.country_name ?? user?.Country ?? "",
  city: user?.city ?? user?.state ?? user?.residence ?? "",
  address: user?.address ?? user?.residential_address ?? user?.mailing_address ?? ""
});

const normalizeUser = (baseUser = {}, formValues = {}, extras = {}) => ({
  ...baseUser,
  ...formValues,
  ...extras,
  name: extras?.name ?? formValues.name ?? baseUser.name,
  userName: extras?.userName ?? extras?.user_name ?? formValues.userName ?? baseUser.userName,
  user_name: extras?.user_name ?? formValues.userName ?? baseUser.user_name,
  phone: extras?.phone ?? formValues.phone ?? baseUser.phone,
  country: extras?.country ?? formValues.country ?? baseUser.country,
  city: extras?.city ?? formValues.city ?? baseUser.city,
  mailing_address: extras?.mailing_address ?? formValues.address ?? baseUser.mailing_address,
  address: extras?.address ?? extras?.mailing_address ?? formValues.address ?? baseUser.address,
  username_locked: extras?.username_locked ?? baseUser?.username_locked,
  usernameLocked: extras?.username_locked ?? extras?.usernameLocked ?? baseUser?.usernameLocked,
});

const ProfileSect = ({ currentUser, setCurrentUser, widgetState, setWidgetState, totalCapital = 0, totalROI = 0, totalBonus = 0, investments = [] }) => {
    const router = useRouter();
    const [passwordShow, setPasswordShow] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteError, setDeleteError] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    
    const [profileForm, setProfileForm] = useState(buildProfileForm(currentUser));
    const [initialUsername, setInitialUsername] = useState(currentUser?.userName ?? currentUser?.user_name ?? "");
    const [usernameLocked, setUsernameLocked] = useState(Boolean(currentUser?.username_locked ?? currentUser?.usernameLocked ?? false));
    const [detailStatus, setDetailStatus] = useState({ message: "", tone: "" });

    const [passwordchange, setpasswordchange] = useState({
        old: "",
        new: "",
        msg: "",
        color: "#DC1262",
    })
    const removeErr = () => {
        setTimeout(() => {
            setpasswordchange({
                old: "",
                new: "",
                msg: "",
                color: "#DC1262",
            })
        }, 3500);
    }

    useEffect(() => {
      setProfileForm(buildProfileForm(currentUser));
      setInitialUsername(currentUser?.userName ?? currentUser?.user_name ?? "");
      setUsernameLocked(Boolean(currentUser?.username_locked ?? currentUser?.usernameLocked ?? false));
    }, [currentUser]);

    const usernameChanged = useMemo(() => {
      const trimmedInitial = (initialUsername || "").trim();
      const trimmedNext = (profileForm?.userName || "").trim();
      return Boolean(trimmedInitial && trimmedNext && trimmedInitial !== trimmedNext);
    }, [initialUsername, profileForm?.userName]);

    const handleDetailUpdate = async () => {
      if (!currentUser?.id) {
        setDetailStatus({ message: "Unable to locate your profile", tone: "error" });
        return;
      }

      if (usernameLocked && usernameChanged) {
        setDetailStatus({ message: "Username has already been updated once", tone: "error" });
        return;
      }

      const payload = {
        name: profileForm.name?.trim() ?? "",
        user_name: profileForm.userName?.trim() ?? "",
        phone: profileForm.phone?.trim() ?? "",
        country: profileForm.country?.trim() ?? "",
        city: profileForm.city?.trim() ?? "",
        mailing_address: profileForm.address?.trim() ?? "",
        username_locked: usernameLocked || usernameChanged,
        avatar: currentUser?.avatar || 'avatar_1',
        updated_at: new Date().toISOString()
      };

      setDetailStatus({ message: "Updating profile...", tone: "pending" });

      // Use updateUserDetails instead of updateUser to match supabaseUtils
      const { data, error } = await supabaseDb.updateUserDetails(currentUser?.id, payload);

      if (error) {
        console.error("Profile update error:", error);
        setDetailStatus({ message: "Could not save changes. Please try again.", tone: "error" });
        return;
      }

      const normalized = normalizeUser(currentUser, profileForm, {
        ...data,
        username_locked: payload.username_locked
      });

      setCurrentUser(normalized);
      setProfileForm(buildProfileForm(normalized));
      setInitialUsername(normalized?.userName ?? "");
      setUsernameLocked(Boolean(normalized?.username_locked));
      sessionStorage.setItem("activeUser", JSON.stringify(normalized));
      setDetailStatus({ message: "Profile updated successfully", tone: "success" });
    }

    const handleInputChange = (field, value) => {
      setProfileForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

    const handleCopy = async (text) => {
      if (!text || typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
        return;
      }
      try {
        await navigator.clipboard.writeText(text);
        setDetailStatus({ message: "Copied to clipboard!", tone: "success" });
        setTimeout(() => setDetailStatus({ message: "", tone: "" }), 2000);
      } catch (copyError) {
        console.warn('Unable to copy text:', copyError);
        setDetailStatus({ message: "Failed to copy", tone: "error" });
      }
    };

    const userBalance = parseFloat(currentUser?.balance || 0);
    const capital = parseFloat(totalCapital || 0);
    const roi = parseFloat(totalROI || 0);
    const bonus = parseFloat(totalBonus || 0);
    // Fix: Removed 'capital' from total to avoid double-counting.
    const total = userBalance + roi + bonus;
    const totalBonusValue = (parseFloat(currentUser?.bonus || 0)) + bonus;

    const snapshotCards = [
      { label: "Available Balance", value: passwordShow ? `$${total.toLocaleString()}` : "******" },
      { label: "Bonuses", value: passwordShow ? `$${totalBonusValue.toLocaleString()}` : "******" },
      { label: "Returns", value: passwordShow ? `$${roi.toLocaleString()}` : "******" },
      { label: "Active / Pending Plans", value: investments.length },
      { label: "Referrals", value: Number(currentUser?.referralCount || 0).toLocaleString() },
      { label: "Full Name", value: profileForm?.name || "Add your name" },
      { label: "Username", value: profileForm?.userName || "Add a username", hint: usernameLocked ? "Locked" : "Editable once" },
      { label: "Email", value: currentUser?.email || "--" },
      { label: "Account Cryptic Id", value: currentUser?.id || "--", copy: true },
      { label: "Register Id", value: currentUser?.idnum || "--", copy: true },
      { label: "Phone", value: profileForm?.phone || "Add phone number" },
      { label: "Country", value: profileForm?.country || "Add country" },
      { label: "City", value: profileForm?.city || "Add city" },
      { label: "Mailing Address", value: profileForm?.address || "Add address" },
    ];

    const referralLink = `https://grantunionn.vercel.app/signup?ref=${currentUser?.referralCode || currentUser?.idnum || ''}`;

    const handlePasswordChnage = async () => {
        try {
            const { data: userData, error } = await supabaseDb.getUserById(currentUser?.id);
            if (error) throw error;

            if (userData.password === passwordchange.old && passwordchange.new !== "") {
                const { error: updateError } = await supabaseDb.updateUser(currentUser?.id, {
                    password: passwordchange?.new
                });

                if (!updateError) {
                    setpasswordchange({...passwordchange, msg: "Password updated successfully.", color: "green"});
                    removeErr();
                } else {
                    setpasswordchange({...passwordchange, msg: "Failed to update password", color: "#DC1262"});
                }
            } else {
                setpasswordchange({...passwordchange, msg: "Invalid old password or new password", color: "#DC1262"});
            }
        } catch (error) {
            setpasswordchange({...passwordchange, msg: "Error updating password", color: "#DC1262"});
        }
    }

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            setDeleteError("Please enter your password to confirm deletion");
            return;
        }

        setIsDeleting(true);
        setDeleteError("");

        try {
            // Verify password by checking against stored password
            const { data: userData, error: userError } = await supabaseDb.getUserById(currentUser?.id);
            if (userError || userData.password !== deletePassword) {
                setDeleteError("Incorrect password. Please try again.");
                setIsDeleting(false);
                return;
            }

            // Delete user data from Supabase
            // Note: In Supabase, we would typically use foreign key constraints and CASCADE delete
            // For now, we'll manually delete related records if needed

            // Delete user document from userlogs table
            const { error: deleteError } = await supabase
                .from('userlogs')
                .delete()
                .eq('id', currentUser?.id);

            if (deleteError) throw deleteError;

            // Delete from Supabase Auth
            const { error: authError } = await supabase.auth.admin.deleteUser(currentUser?.id);
            if (authError) {
                console.warn('Failed to delete from auth, but user data deleted:', authError);
            }

            // Clear local storage
            localStorage.clear();
            sessionStorage.clear();

            // Redirect to home
            router.push('/');
        } catch (error) {
            console.error('Error deleting account:', error);
            setDeleteError("Failed to delete account. Please contact support.");
            setIsDeleting(false);
        }
    }
  return (

    <>
      <div className={profileStyles.profileContainer}>
        <div className={profileStyles.topSection}>
          <h2>Welcome back, {currentUser?.userName}.</h2>
          <div className={profileStyles.profileHeader}>
            <div className={profileStyles.avatar} style={{backgroundImage: `url(/${currentUser?.avatar || 'avatar_1'}.png)`}} onClick={() => {setWidgetState({...widgetState, state: true})}}></div>
            <div className={profileStyles.userInfo}>
              <h3>{currentUser?.name}</h3>
              <p>{currentUser?.email}</p>
            </div>
          </div>
        </div>
        <div className={profileStyles.accountSnapshot}>
          <div className={profileStyles.snapshotHeader}>
            <h2>Account Snapshot</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <p>Quick view of your key profile identifiers and contact info.</p>
              <span
                onClick={() => setPasswordShow((prev) => !prev)}
                style={{ cursor: 'pointer', fontSize: '1.2rem', color: '#666' }}
                title={passwordShow ? "Hide financial details" : "Show financial details"}
              >
                <i className={`icofont-eye-${!passwordShow ? "alt" : "blocked"}`}></i>
              </span>
            </div>
          </div>
          <div className={profileStyles.snapshotGrid}>
            {snapshotCards.map((card) => (
              <div key={card.label} className={profileStyles.snapshotCard}>
                <p className={profileStyles.snapshotLabel}>{card.label}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <p className={profileStyles.snapshotValue}>{card.value}</p>
                  {card.copy && (
                    <i 
                      className="icofont-ui-copy" 
                      style={{ cursor: 'pointer', color: '#FFB347', fontSize: '1.1em' }}
                      onClick={() => handleCopy(card.value)}
                      title="Copy to clipboard"
                    ></i>
                  )}
                </div>
                {card.hint && (
                  <span className={usernameLocked ? profileStyles.snapshotBadgeLocked : profileStyles.snapshotBadge}>
                    {card.hint}
                  </span>
                )}
              </div>
            ))}
          </div>
          
          <div className={profileStyles.snapshotHeader} style={{ marginTop: '2rem' }}>
            <h2>Referral Link</h2>
            <p>Share this link to invite others and earn bonuses.</p>
          </div>
          <div className={profileStyles.snapshotCard} style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <p style={{ wordBreak: 'break-all', color: 'var(--text-clr1)', fontSize: '0.95rem' }}>{referralLink}</p>
            <button 
              onClick={() => handleCopy(referralLink)}
              style={{
                background: 'rgba(255, 179, 71, 0.15)',
                border: '1px solid #FFB347',
                color: '#FFB347',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '500'
              }}
            >
              <i className="icofont-ui-copy"></i> Copy Link
            </button>
          </div>
        </div>

        <div className={profileStyles.formSection}>
          <h2>Edit Profile & Contact</h2>
          <div className={profileStyles.formGrid}>
            <div className={profileStyles.inputGroup}>
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                value={profileForm?.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>
            <div className={profileStyles.inputGroup}>
              <label htmlFor="username">
                Username {usernameLocked && <span className={profileStyles.lockTag}>Locked</span>}
              </label>
              <input
                id="username"
                type="text"
                value={profileForm?.userName}
                onChange={(e) => handleInputChange("userName", e.target.value)}
                disabled={usernameLocked}
              />
            </div>
            <div className={profileStyles.inputGroup}>
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                value={profileForm?.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="e.g. +1 555 555 5555"
              />
            </div>
            <div className={profileStyles.inputGroup}>
              <label htmlFor="country">Country</label>
              <select
                id="country"
                value={profileForm?.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(0, 0, 0, 0.2)',
                  color: 'var(--text-clr1)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="" disabled>Select your country</option>
                {COUNTRIES.map((country) => (
                  <option key={country} value={country} style={{ color: '#000' }}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
            <div className={profileStyles.inputGroup}>
              <label htmlFor="city">City</label>
              <input
                id="city"
                type="text"
                value={profileForm?.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
              />
            </div>
            <div className={profileStyles.inputGroup} style={{ gridColumn: "span 2" }}>
              <label htmlFor="address">Mailing Address</label>
              <input
                id="address"
                type="text"
                value={profileForm?.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Street, State, Zip"
              />
            </div>
          </div>

          {detailStatus?.message && (
            <p
              className={`${profileStyles.statusMessage} ${
                detailStatus.tone === "success"
                  ? profileStyles.statusSuccess
                  : detailStatus.tone === "error"
                  ? profileStyles.statusError
                  : profileStyles.statusPending
              }`}
            >
              {detailStatus.message}
            </p>
          )}

          <button type="button" onClick={handleDetailUpdate} className={profileStyles.saveBtn}>
            Save Profile
          </button>
        </div>
        <div className={profileStyles.formSection}>
          <h2>Change Password</h2>
          <div className={profileStyles.formGrid}>
            <div className={profileStyles.inputGroup}>
              <label htmlFor="name">Old Password</label>
              <input type="text" onChange={(e) => {setpasswordchange({...passwordchange, old: e.target.value})}}/>
            </div>
            <div className={profileStyles.inputGroup}>
              <label htmlFor="name">New Password</label>
              <div className={profileStyles.relativeInput}>
                <input type={passwordShow ? "text": "password"} onChange={(e) => {setpasswordchange({...passwordchange, new: e.target.value})}}/>
                <span className={profileStyles.passwordToggle} onClick={() => {setPasswordShow(prev => !prev)}}><i className={`icofont-eye-${!passwordShow? "alt": "blocked"}`}></i></span>
              </div>
            </div>
            <p style={{color: `${passwordchange?.color}`, gridColumn: "span 2"}}>{passwordchange?.msg}</p>
          </div>
          <button type="button" onClick={handlePasswordChnage} className={profileStyles.saveBtn}>Update Password</button>
        </div>

        {/* Delete Account Section */}
        <div className={profileStyles.dangerZone}>
          <div className={profileStyles.dangerHeader}>
            <i className="icofont-warning"></i>
            <h2>Danger Zone</h2>
          </div>
          <p className={profileStyles.dangerText}>
            Once you delete your account, there is no going back. This action <strong>cannot be undone</strong>.
            All your data including investments, withdrawals, and account information will be permanently deleted.
          </p>
          <button 
            type="button" 
            onClick={() => setShowDeleteModal(true)}
            className={profileStyles.deleteBtn}
          >
            <i className="icofont-trash"></i>
            Delete My Account
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className={profileStyles.modalOverlay}>
          <div className={profileStyles.modalCard}>
            <div className={profileStyles.modalHeader}>
              <div className={profileStyles.modalIcon}>
                ⚠️
              </div>
              <h3 className={profileStyles.modalTitle}>
                Delete Account
              </h3>
            </div>
            
            <div className={profileStyles.modalWarning}>
              <p>
                <strong>Warning:</strong> This action is permanent. All data will be deleted:
              </p>
              <ul>
                <li>Account profile</li>
                <li>Investment records</li>
                <li>Withdrawal history</li>
                <li>Notifications</li>
              </ul>
            </div>
            
            <div className={profileStyles.modalInputGroup}>
              <label htmlFor="deletePassword">
                Enter password to confirm:
              </label>
              <input
                id="deletePassword"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Your password"
                className={profileStyles.modalInput}
                disabled={isDeleting}
              />
            </div>
            
            {deleteError && (
              <div className={`${profileStyles.statusMessage} ${profileStyles.statusError}`} style={{marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <i className="icofont-warning"></i>
                <span>{deleteError}</span>
              </div>
            )}
            
            <div className={profileStyles.modalActions}>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword("");
                  setDeleteError("");
                }}
                disabled={isDeleting}
                className={profileStyles.modalCancelBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className={profileStyles.modalDeleteBtn}
              >
                {isDeleting ? (
                  <>
                    <i className="icofont-spinner icofont-spin" style={{ marginRight: '0.4rem' }}></i>
                    Deleting...
                  </>
                ) : (
                  'Delete Permanently'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProfileSect;

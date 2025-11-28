import React, { useEffect, useState } from 'react';
import { supabaseDb } from "../../database/supabaseUtils";
import Modal from "../Modal";

const UsersAdmin = ({ activeUsers = [], investments = [], withdrawals = [], setProfileState, setUserData}) => {
  const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('date');
    const [sortOrder, setSortOrder] = useState('desc');
    // const [showDeleteModal, setShowDeleteModal] = useState(false); // Replaced by Modal
    // const [showSuspendModal, setShowSuspendModal] = useState(false); // Replaced by Modal
    const [selectedUser, setSelectedUser] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Modal State
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        type: '',
        title: '',
        message: '',
        onConfirm: null
    });

    const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

    const showModal = (type, title, message, onConfirm = null) => {
        setModalConfig({
            isOpen: true,
            type,
            title,
            message,
            onConfirm
        });
    };

    // Calculate user stats
    const userStats = activeUsers.reduce((stats, user) => {
        const userInvestments = investments.filter(inv => inv.idnum === user.idnum);
        const userWithdrawals = withdrawals.filter(w => w.idnum === user.idnum);
        
        return {
            totalUsers: stats.totalUsers + 1,
            activeUsers: stats.activeUsers + (userInvestments.some(inv => inv.status === 'Active') ? 1 : 0),
            totalBalance: stats.totalBalance + (parseFloat(user.balance) || 0),
            avgInvestment: stats.avgInvestment + (userInvestments.reduce((sum, inv) => sum + (parseFloat(inv.capital) || 0), 0) / (userInvestments.length || 1))
        };
    }, { totalUsers: 0, activeUsers: 0, totalBalance: 0, avgInvestment: 0 });

    useEffect(() => {
        if (Array.isArray(activeUsers)) {
            activeUsers.forEach(async(elem) => {
                try {
                    await supabaseDb.updateUser(elem.id, {
                        authStatus: "seen"
                    });
                } catch (error) {
                    console.log(error);
                }
            });
        }
    }, [activeUsers]);

    // Handle delete user
    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        
        setIsProcessing(true);
        try {
            // Delete related investments
            await supabaseDb.deleteInvestmentsByUserId(selectedUser.id);
            
            // Delete related withdrawals
            await supabaseDb.deleteWithdrawalsByUserId(selectedUser.id);
            
            // Delete user document
            await supabaseDb.deleteUser(selectedUser.id);
            
            showModal('success', 'Success', `User ${selectedUser.name} has been deleted successfully`);
            setSelectedUser(null);
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            console.error("Error deleting user:", error);
            showModal('error', 'Error', "Failed to delete user. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle suspend/activate user
    const handleToggleSuspend = async () => {
        if (!selectedUser) return;
        
        setIsProcessing(true);
        try {
            const newStatus = selectedUser.accountStatus === "suspended" ? "active" : "suspended";
            await supabaseDb.updateUser(selectedUser.id, {
                accountStatus: newStatus
            });
            
            showModal('success', 'Success', `User ${selectedUser.name} has been ${newStatus === "suspended" ? "suspended" : "activated"} successfully`);
            setSelectedUser(null);
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            console.error("Error updating user status:", error);
            showModal('error', 'Error', "Failed to update user status. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };  const filteredUsers = activeUsers.filter(user => {
    return !searchTerm || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.idnum.toString().includes(searchTerm);
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue = sortField === 'date' ? new Date(a[sortField]) : a[sortField];
    let bValue = sortField === 'date' ? new Date(b[sortField]) : b[sortField];
    return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
  });

  return (
    <div className="investmentMainCntn">
      <div className="overviewSection">
        <div className="dashboardStats">
          <div className="statCard">
            <h3>Total Users</h3>
            <h2>{userStats.totalUsers}</h2>
          </div>
          <div className="statCard">
            <h3>Active Users</h3>
            <h2>{userStats.activeUsers}</h2>
          </div>
          <div className="statCard">
            <h3>Total Balance</h3>
            <h2>${userStats.totalBalance.toLocaleString()}</h2>
          </div>
          <div className="statCard">
            <h3>Avg Investment</h3>
            <h2>${Math.round(userStats.avgInvestment).toLocaleString()}</h2>
          </div>
        </div>
        <div className="filterSection">
          <div className="searchBox">
            <input 
              type="text" 
              placeholder="Search by name, email or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="sortOptions">
            <select onChange={(e) => setSortField(e.target.value)}>
              <option value="date">Join Date</option>
              <option value="balance">Balance</option>
              <option value="investmentCount">Investments</option>
            </select>
            <button onClick={() => setSortOrder(order => order === 'asc' ? 'desc' : 'asc')}>
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>
    <div className="myinvestmentSection">
      <h2>Users Data ({filteredUsers.length})</h2>
      {
          activeUsers.length > 0 ? (
              <div className="usersTableContainer">
                  <table className="usersTable">
                      <thead>
                          <tr>
                              <th>S/N</th>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Cryptic ID</th>
                              <th>Balance</th>
                              <th>Bonus</th>
                              <th>Investments</th>
                              <th>Referrals</th>
                              <th>KYC Status</th>
                              <th>Joined On</th>
                              <th>Status</th>
                              <th>Actions</th>
                          </tr>
                      </thead>
                      <tbody>
                          {
                              sortedUsers.map((elem, idx) => (
                                  <tr key={`${elem.idnum}-UAdmin_${idx}`}>
                                      <td>{idx + 1}</td>
                                      <td>
                                          <span 
                                              className="clickable-name"
                                              onClick={() => {setUserData(elem); setProfileState("Edit User")}}
                                          >
                                              {elem?.name || elem?.userName || 'N/A'}
                                          </span>
                                      </td>
                                      <td className="email-cell">{elem?.email || 'N/A'}</td>
                                      <td className="cryptic-id">{elem?.id?.substring(0, 8)}...</td>
                                      <td className="balance">${parseFloat(elem?.balance || 0).toLocaleString()}</td>
                                      <td className="bonus">${parseFloat(elem?.bonus || 0).toLocaleString()}</td>
                                      <td>{elem?.investmentCount || 0}</td>
                                      <td>{elem?.referralCount || 0}</td>
                                      <td>
                                          <span className={`kyc-status ${elem?.kyc_status || 'pending'}`}>
                                              {elem?.kyc_status === 'verified' ? 'Verified' : 
                                               elem?.kyc_status === 'rejected' ? 'Rejected' : 'Pending'}
                                          </span>
                                      </td>
                                      <td>{new Date(elem?.date || elem?.created_at).toLocaleDateString("en-US", {
                                          day: "numeric", 
                                          month: "short", 
                                          year: "numeric"
                                      })}</td>
                                      <td>
                                          <span className={`account-status ${elem.accountStatus === 'suspended' ? 'suspended' : 'active'}`}>
                                              {elem.accountStatus === 'suspended' ? 'Suspended' : 'Active'}
                                          </span>
                                      </td>
                                      <td>
                                          <div className="action-buttons">
                                              <button
                                                  className={`action-btn ${elem.accountStatus === 'suspended' ? 'activate' : 'suspend'}`}
                                                  onClick={() => {
                                                      setSelectedUser(elem);
                                                      showModal('confirm', 'Confirm Status Change', 
                                                          `Are you sure you want to ${elem.accountStatus === 'suspended' ? 'activate' : 'suspend'} user ${elem.name}?`,
                                                          handleToggleSuspend
                                                      );
                                                  }}
                                              >
                                                  {elem.accountStatus === 'suspended' ? 'Activate' : 'Suspend'}
                                              </button>
                                              <button
                                                  className="action-btn delete"
                                                  onClick={() => {
                                                      setSelectedUser(elem);
                                                      showModal('confirm', 'Confirm Delete', 
                                                          `Are you sure you want to delete user ${elem.name}? This action cannot be undone.`,
                                                          handleDeleteUser
                                                      );
                                                  }}
                                              >
                                                  Delete
                                              </button>
                                          </div>
                                      </td>
                                  </tr>
                              ))
                          }
                      </tbody>
                  </table>
              </div>

          ) : (

              <div className="emptyTable">
                  <i className="icofont-exclamation-tringle"></i>
                  <p>
                      You currently have no active user.
                  </p>
              </div>
          )
      }
    </div>

    {/* Modal Component */}
    <Modal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        title={modalConfig.title}
    >
        {modalConfig.type === 'confirm' ? (
            <div>
                <p style={{color: 'var(--text-clr1)', marginBottom: '20px'}}>{modalConfig.message}</p>
                <div style={{display: 'flex', gap: '12px', justifyContent: 'center'}}>
                    <button
                        onClick={closeModal}
                        disabled={isProcessing}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '25px',
                            border: '1px solid var(--text-deco)',
                            background: 'transparent',
                            color: 'var(--text-clr1)',
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            fontWeight: 600
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={modalConfig.onConfirm}
                        disabled={isProcessing}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '25px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #FFB347, #FF7A18)',
                            color: '#1C0F36',
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            fontWeight: 600
                        }}
                    >
                        {isProcessing ? 'Processing...' : 'Confirm'}
                    </button>
                </div>
            </div>
        ) : (
            <div>
                <p style={{color: 'var(--text-clr1)', marginBottom: '20px'}}>{modalConfig.message}</p>
                <div style={{display: 'flex', justifyContent: 'center'}}>
                    <button 
                        onClick={closeModal} 
                        style={{
                            padding: '10px 24px',
                            borderRadius: '25px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #FFB347, #FF7A18)',
                            color: '#1C0F36',
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        OK
                    </button>
                </div>
            </div>
        )}
    </Modal>
  </div>
  )
}

export default UsersAdmin

import React, { useState } from 'react'
import { supabaseDb } from "../../database/supabaseUtils";
import Modal from "../Modal";

const UnitInvestSect = ({ setInvestData, setProfileState, investData, currentUser }) => {
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

  const notificationPush = {
    message: `Your $${investData?.capital} ${investData?.plan} investment plan has been activated`,
    idnum: investData.idnum,
    status: "unseen"
  };

  const handleDetailUpdate = async () => {
    try {
      await supabaseDb.updateInvestment(investData?.id, {
        roi: investData?.roi,
        authStatus: "seen"
      });
      setProfileState("Investments");
    } catch (error) {
      console.error("Error updating investment details:", error);
    }
  };

  const handleActiveInvestment = async () => {
    try {
      const approvedBy = currentUser?.id || currentUser?.userName || 'admin';

      await supabaseDb.activateInvestment(investData?.id, {
        approvedBy,
        capital: parseFloat(investData?.capital) || 0,
        roi: parseFloat(investData?.roi) || 0,
        bonus: parseFloat(investData?.bonus) || 0,
        idnum: investData?.idnum,
        creditBonus: false
      });

      await supabaseDb.createNotification(notificationPush);
      showModal('success', 'Success', 'Investment activated successfully');
      setTimeout(() => {
          setProfileState("Investments");
      }, 1500);
    } catch (err) {
      console.error('Error activating investment:', err);
      try { await supabaseDb.createNotification(notificationPush); } catch(e){}
      showModal('error', 'Error', 'Error activating investment');
      setTimeout(() => {
          setProfileState("Investments");
      }, 1500);
    }
  };

  return (
    <div className="profileMainCntn">
      <div className="profileEditableDisplay">
          <h2>Investment Details</h2>
          <div className="theFormField">
            <div className="unitInputField">
              <label htmlFor="name">ROI</label>
              <input type="text" value={investData?.roi} onChange={(e) => {setInvestData({...investData, roi: parseInt(e.target.value !== ""? e.target.value : "0")})}}/>
            </div>
            <div className="unitInputField">
              <label htmlFor="name">Inestment Status</label>
              <input type="text" disabled value={investData?.status} />
            </div>
            <div className="unitInputField">
              <label htmlFor="name">Plan</label>
              <input type="text" disabled value={investData?.plan} />
            </div>
            <div className="unitInputField">
              <label htmlFor="name">Capital</label>
              <input type="text" disabled value={investData?.capital} />
            </div>
            <div className="unitInputField">
              <label htmlFor="name">Investment Cryptic Id.</label>
              <input type="text" disabled value={investData?.id} />
            </div>
            <div className="unitInputField">
              <label htmlFor="name">Investment Register Id.</label>
              <input type="text" disabled value={investData?.idnum} />
            </div>
            <div className="unitInputField">
              <label htmlFor="name">Duration</label>
              <input type="text" disabled value={`${investData?.duration} days`} />
            </div>
            <div className="unitInputField">
              <label htmlFor="name">Payment Option</label>
              <input type="text" disabled value={investData?.paymentOption} />
            </div>
            <div className="unitInputField">
              <label htmlFor="name">Date</label>
              <input type="text" disabled value={new Date(investData?.date).toLocaleDateString("en-US", {day: "numeric", month: "short", year: "numeric", }) } />
            </div>
            <div className="unitInputField">
              <label htmlFor="name">Time</label>
              <input type="text" disabled value={new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, }).format(new Date(investData?.date))} />
            </div>
            
          </div>

            <div className="flex-align-jusc">
                {
                    investData?.status === "Pending" && (
                        <button 
                            type="button" 
                            onClick={() => showModal('confirm', 'Confirm Activation', 
                                `Activate investment ${investData?.id} for ${investData?.idnum}? This will credit the user's balance.`,
                                handleActiveInvestment
                            )} 
                            className='activateBtn'
                        >
                            Activate Investment
                        </button>
                    )
                }
                <button type="button" onClick={handleDetailUpdate} className='updateBtn'>Update Details</button>
            </div>
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
                        style={{
                            padding: '10px 24px',
                            borderRadius: '25px',
                            border: '1px solid var(--text-deco)',
                            background: 'transparent',
                            color: 'var(--text-clr1)',
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={modalConfig.onConfirm}
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
                        Confirm
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

export default UnitInvestSect

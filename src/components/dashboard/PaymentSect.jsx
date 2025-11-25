import React, { useState, useEffect } from 'react';
import { supabaseDb } from "../../database/supabaseUtils";
import Modal from "../Modal";

const PaymentSect = ({setProfileState, investData, bitPrice, ethPrice, setInvestments}) => {
    const [copystate, setCopystate] = useState("Copy");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const [modalType, setModalType] = useState("success");

    // Debug logging for prices
    useEffect(() => {
        console.log('PaymentSect Prices:', { 
            bitPrice, 
            ethPrice, 
            bitPriceType: typeof bitPrice, 
            ethPriceType: typeof ethPrice,
            investAmount: investData?.capital 
        });
    }, [bitPrice, ethPrice, investData?.capital]);

    // Helper function to calculate crypto amount
    const calculateCryptoAmount = (amount, price, crypto) => {
        if (!price || price <= 0 || !amount || amount <= 0) {
            console.warn(`Invalid ${crypto} calculation:`, { amount, price });
            return '0.000';
        }
        const result = (amount / price).toFixed(8);
        console.log(`${crypto} calculation:`, { amount, price, result });
        return parseFloat(result).toFixed(3); // Show 3 decimals for investment
    };

    const removeErr = () => {
        setTimeout(() => {
            setCopystate("Copy");
        }, 2500);
    }

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
          .then(() => {
            setCopystate("Copied");
            removeErr()
          })
          .catch((err) => {
            console.error('Unable to copy text to clipboard', err);
          });
    }

    const handleTransacConfirmation = async () => {
        // Ensure the investment is created with "Pending" status and no pre-calculated bonus
        const investmentToCreate = {
            ...investData,
            status: "Pending", // Explicitly set status to Pending
            roi: 0, // Will be calculated during admin approval
            bonus: 0, // Will be calculated during admin approval
            credited_roi: 0, // Track credited amounts
            credited_bonus: 0
        };

        console.log('Creating investment with pending status:', investmentToCreate);

        const { data, error } = await supabaseDb.createInvestment(investmentToCreate);
        if (error) {
            console.error('Error creating investment:', error);
            setModalTitle("Error");
            setModalMessage("Error creating investment. Please try again.");
            setModalType("error");
            setModalOpen(true);
            return;
        }

        console.log('Investment created successfully with ID:', data?.id);
        
        // Update local state immediately
        if (setInvestments && data) {
            setInvestments(prev => [data, ...prev]);
        } else if (setInvestments) {
             // Fallback if data is not returned but no error (unlikely with Supabase)
             setInvestments(prev => [investmentToCreate, ...prev]);
        }

        setModalTitle("Success");
        setModalMessage("Investment submitted successfully! Your investment is now pending admin approval. You can check the status in your Investment History.");
        setModalType("success");
        setModalOpen(true);
    }

    const handleModalClose = () => {
        setModalOpen(false);
        if (modalType === "success") {
            setProfileState("Investments");
        }
    }

  return (
    <div className="paymentSect" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '2rem' }}>Confirm Payment</h2>
        
        <div className="mainPaymentSect" style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', color: '#ccc' }}>
                Send exactly <span style={{ color: '#FFB347', fontSize: '1.4rem', fontWeight: 'bold', display: 'block', marginTop: '0.5rem' }}>
                    {investData?.paymentOption === "Bitcoin" ? `${calculateCryptoAmount(investData?.capital, bitPrice, 'BTC')} BTC` : 
                     investData?.paymentOption === "Ethereum" ? `${calculateCryptoAmount(investData?.capital, ethPrice, 'ETH')} ETH` :
                     `${parseFloat(investData?.capital).toFixed(2)} USDT`}
                </span>
            </h3>
            
            <div style={{ marginTop: '2rem' }}>
                <p style={{ marginBottom: '0.5rem', color: '#aaa', fontSize: '0.9rem' }}>To this {investData?.paymentOption} address:</p>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    background: 'rgba(0,0,0,0.3)', 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    border: '1px solid rgba(255,179,71,0.2)',
                    flexWrap: 'wrap',
                    gap: '10px'
                }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: '#fff', wordBreak: 'break-all' }}>
                        {investData?.paymentOption === "Bitcoin" ? "12mmqmLsULbMTDCuP5ESCiDApW7p3CfeSL" : 
                         investData?.paymentOption === "Ethereum" ? "0x1D2C71bF833Df554A86Ad142f861bc12f3B24c1c" :
                         "0x675be3dc056d6a0c199395d66e21101ad87504f4"}
                    </span>
                    <button 
                        onClick={() => {copyToClipboard(`${investData?.paymentOption === "Bitcoin" ? "12mmqmLsULbMTDCuP5ESCiDApW7p3CfeSL" : investData?.paymentOption === "Ethereum" ? "0x1D2C71bF833Df554A86Ad142f861bc12f3B24c1c" : "0x675be3dc056d6a0c199395d66e21101ad87504f4"}`)}}
                        style={{
                            background: 'rgba(255, 179, 71, 0.15)',
                            border: '1px solid #FFB347',
                            color: '#FFB347',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            marginLeft: 'auto'
                        }}
                    >
                        {copystate} <i className="icofont-ui-copy"></i>
                    </button>
                </div>
            </div>
        </div>

        <div style={{ marginTop: '2rem', background: 'rgba(45, 193, 148, 0.1)', padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid #2DC194' }}>
            <p style={{ color: '#e0e0e0', marginBottom: '1rem', lineHeight: '1.6' }}>
                <i className="icofont-info-circle" style={{ color: '#2DC194', marginRight: '8px' }}></i>
                Please confirm the transaction after the specified amount has been transferred.
            </p>
            <p style={{ color: '#aaa', fontSize: '0.9rem', lineHeight: '1.5' }}>
                The completion of the transaction process might take between a couple of minutes to several hours. You can check the status of your investment in the Investment section of your dashboard.
            </p>
        </div>

        <button 
            type="button" 
            onClick={handleTransacConfirmation}
            style={{
                marginTop: '2rem',
                padding: '1rem 2rem',
                background: 'linear-gradient(45deg, #FFB347, #ff9f1a)',
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                cursor: 'pointer',
                width: '100%',
                boxShadow: '0 4px 15px rgba(255, 179, 71, 0.3)',
                transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
        >
            Confirm Transaction
        </button>

        <Modal isOpen={modalOpen} onClose={handleModalClose} title={modalTitle}>
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <i className={modalType === 'success' ? "icofont-check-circled" : "icofont-close-circled"} 
                   style={{ fontSize: '3rem', color: modalType === 'success' ? '#2DC194' : '#DC1262' }}></i>
                <p>{modalMessage}</p>
                <button 
                    onClick={handleModalClose}
                    style={{
                        padding: '0.8rem 1.5rem',
                        background: 'linear-gradient(45deg, #FFB347, #ff9f1a)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#000',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        width: '100%'
                    }}
                >
                    {modalType === 'success' ? 'Go to Investments' : 'Close'}
                </button>
            </div>
        </Modal>
    </div>
  )
}

export default PaymentSect



// 0x1D2C71bF833Df554A86Ad142f861bc12f3B24c1c
import {useEffect, useState} from "react";
import { supabaseDb, supabaseRealtime } from "../../database/supabaseUtils";
import { useRouter } from 'next/router';
import { PLAN_CONFIG, getPlanByName, formatPercent } from "../../utils/planConfig";


const DynamicWidget = ({widgetState, setWidgetState, currentUser, setCurrentUser, investData, setInvestData, setProfileState, withdrawData, setWithdrawData, totalBonus, totalCapital, totaROI}) => {
    const [investments, setInvestments] = useState([]);
    const [error, setError] = useState(""); // Add error state

    const router = useRouter();
    const handlewidgetClose = () => {
        setWidgetState({...widgetState, state: false});
        setError(""); // Clear error on close
    };

    const handleProceed = (e) => {
        e.preventDefault();
        handlewidgetClose();
        setProfileState("Payments");
    };

    const handleProceedWithdraw = (e) => {
        e.preventDefault();
        handlewidgetClose();
        setProfileState("Withdrawal Payment");
    };

    useEffect(() => {
        let channel = null;

        if (currentUser?.idnum) {
            try {
                channel = supabaseRealtime.subscribeToInvestments(currentUser.idnum,
                    (payload) => {
                        // Refresh investments data when there's a change
                        supabaseDb.getInvestmentsByIdnum(currentUser.idnum).then(({ data, error }) => {
                            if (!error && data) {
                                setInvestments(data);
                            }
                        });
                    }
                );
            } catch (error) {
                console.error("Error setting up investment listener:", error);
            }
        }

        // Cleanup subscription on unmount
        return () => {
            if (channel && typeof channel.unsubscribe === 'function') {
                channel.unsubscribe();
            }
        };
    }, [currentUser?.idnum]);

    const handleAccoutDelete = async () => {
        if (!currentUser?.id) {
            console.error('No user ID found for deletion');
            return;
        }

        try {
            await supabaseDb.deleteUser(currentUser.id);
            router.push("/signup");
        } catch (error) {
            console.error("Error deleting account:", error);
            // You might want to show an error message to the user here
        }
    }

    const selectedPlan = getPlanByName(investData?.plan);

    const handlePlanChange = (value) => {
        const plan = getPlanByName(value);
        setInvestData((prev) => ({
            ...prev,
            plan: plan.name,
            duration: plan.durationDays,
            capital: Math.max(plan.minCapital, Number(prev?.capital) || 0)
        }));
    };

    return (
        <div className="absoluteDynamicWidget">
            {
                widgetState.type === "avatar" && (
                    <div className="avatarSection">
                        <span type="button" onClick={handlewidgetClose}><i className="icofont-close-line"></i></span>
                        <h2>Select Avatar</h2>
                        <div className="avatars">
                            <button className="unitAvatar" onClick={() => {setCurrentUser({...currentUser, avatar: "avatar_1"})}}><span></span></button>
                            <button className="unitAvatar" onClick={() => {setCurrentUser({...currentUser, avatar: "avatar_2"})}}><span></span></button>
                        </div>
                        <button type="button" onClick={handlewidgetClose}>Select</button>
                    </div>

                )
            } 
            {
                widgetState.type === "invest" && (
                    <div className="avatarSection investwidgetSection">
                        <span type="button" onClick={handlewidgetClose}><i className="icofont-close-line"></i></span>
                        <h2>Initiate Investment</h2>
                        <p>You are about to invest in the <span>{selectedPlan?.name}</span> package which takes a period of <span>{selectedPlan?.durationLabel}</span></p>
                        <div className="investMinmax">
                            Minimum deposit ${selectedPlan?.minCapital.toLocaleString()} | {formatPercent(selectedPlan?.dailyRate || 0)} daily | Withdraw after {selectedPlan?.durationLabel}
                        </div>
                        <form className='widgetInvestForm' onSubmit={handleProceed}>
                            <div className="unitInputField">
                                <label htmlFor="name">Amount to Invest</label>
                                <input type="text" required value={investData?.capital} onChange={(e) => {setInvestData({...investData, capital: parseInt(e.target.value !== ""? e.target.value : "0")})}}/>
                            </div>
                            <div className="unitInputField">
                                <label htmlFor="name">Investment Plan</label>
                                <select required value={investData?.plan} onChange={(e) => handlePlanChange(e.target.value)}>
                                    {PLAN_CONFIG.map((plan) => (
                                        <option key={plan.id} value={plan.name}>{plan.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="unitInputField">
                                <label htmlFor="name">Payment Option</label>
                                <select required value={investData?.paymentOption} onChange={(e) => {setInvestData({...investData, paymentOption: e.target.value})}}>
                                    <option value="Bitcoin">Bitcoin</option>
                                    <option value="Ethereum">Ethereum</option>
                                    <option value="USDT">USDT</option>
                                </select>
                            </div>
                            <div className="bottomBtnCntn">
                                <button type="submit">Proceed</button>
                                <button type='button' onClick={handlewidgetClose}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )
            }
            {
                /* withdraw-code block removed */
            }
            {
                widgetState.type === "withdraw" && (parseFloat(currentUser?.balance || 0) + parseFloat(currentUser?.bonus || 0)) < 200 && (
                    <div className="avatarSection emptySesction">
                        <span type="button" onClick={handlewidgetClose}><i className="icofont-close-line"></i></span>

                        <h2>Your Balance is insufficient to make a widthrawal at the moment. Kindly invest or make a deposit.</h2>
                    </div>
                )
            }
            {
                widgetState.type === "withdraw" && (parseFloat(currentUser?.balance || 0) + parseFloat(currentUser?.bonus || 0)) >= 200 && (
                    <div className="avatarSection investwidgetSection" style={{
                        maxWidth: '380px', 
                        width: '95%',
                        padding: '24px 20px',
                        margin: '0 auto'
                    }}>
                        <span type="button" onClick={handlewidgetClose} style={{
                            cursor: 'pointer',
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            fontSize: '24px'
                        }}><i className="icofont-close-line"></i></span>
                        <h2 style={{
                            marginBottom: '16px', 
                            fontSize: '1.4rem',
                            fontWeight: '600',
                            textAlign: 'center'
                        }}>Confirm Withdrawal</h2>
                        <p style={{
                            fontSize: '0.95rem', 
                            color: '#666', 
                            marginBottom: '24px', 
                            textAlign: 'center'
                        }}>
                            You are about to withdraw <strong>${widgetState.amount?.toLocaleString()}</strong> via <strong>{widgetState.paymentOption}</strong>.
                        </p>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            marginTop: '20px'
                        }}>
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    setWithdrawData({
                                        ...withdrawData,
                                        amount: widgetState.amount,
                                        paymentOption: widgetState.paymentOption,
                                        bankName: widgetState.bankName,
                                        bankAccountNumber: widgetState.bankAccountNumber,
                                        bankAccountName: widgetState.bankAccountName,
                                        bankRoutingSwift: widgetState.bankRoutingSwift
                                    });
                                    handleProceedWithdraw(e);
                                }}
                                style={{
                                    background: '#003459',
                                    color: 'white',
                                    padding: '14px',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'background 0.3s'
                                }}
                            >
                                Proceed
                            </button>
                            <button 
                                onClick={handlewidgetClose}
                                style={{
                                    background: 'transparent',
                                    color: '#666',
                                    padding: '12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                        {/* Form content removed */}
                    </div>
                )
            }
            {
                widgetState.type === "delete" && totalCapital < 100 && (
                    <div className="avatarSection investwidgetSection">
                        <span type="button" onClick={handlewidgetClose}><i className="icofont-close-line"></i></span>
                        <i className="icofont-exclamation-tringle" style={{fontSize:"4em",color: "#DC1262"}}></i>
                        <h2>Are you sure you want to delete this account?</h2>
                        <div className="bottomBtnCntn">
                            <button type="submit" onClick={handleAccoutDelete}>Proceed</button>
                            <button type='button' onClick={handlewidgetClose}>Cancel</button>
                        </div>
                    </div>
                )
            }
        </div>
    );
}

export default DynamicWidget

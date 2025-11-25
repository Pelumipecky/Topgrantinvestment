// CoinGecko Market Data Widget
import React from 'react';

const AnalyticsViewWidget = () => {
  return (
    <div style={{ width: '100%', height: '400px', backgroundColor: '#1d2224', padding: '20px', borderRadius: '8px' }}>
      <iframe
        src="https://www.coingecko.com/en/widgets/coin_price_chart_widget?widgets=price_chart&defi_coins=0&include_24hr_changes=true"
        width="100%"
        height="100%"
        frameBorder="0"
        allowFullScreen
        title="CoinGecko Price Chart"
        style={{ borderRadius: '8px' }}
      ></iframe>
      <div style={{ textAlign: 'center', marginTop: '10px', color: '#888' }}>
        <a href="https://www.coingecko.com/" rel="noopener nofollow" target="_blank" style={{ color: '#2962FF' }}>
          Powered by CoinGecko
        </a>
      </div>
    </div>
  );
};

export default AnalyticsViewWidget;


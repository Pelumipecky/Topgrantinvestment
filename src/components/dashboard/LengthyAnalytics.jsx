// TradingView Advanced Real-Time Chart Widget
import React, { useEffect, useRef } from 'react';

const AdvancedChartWidget = ({ containerId = "tradingview_advanced_chart", height = "600px" }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.TradingView && containerRef.current) {
        new window.TradingView.widget({
          "autosize": true,
          "symbol": "BINANCE:BTCUSDT",
          "interval": "D",
          "timezone": "Etc/UTC",
          "theme": "dark",
          "style": "1",
          "locale": "en",
          "toolbar_bg": "#f1f3f6",
          "enable_publishing": false,
          "allow_symbol_change": true,
          "container_id": containerId,
          "hide_side_toolbar": false,
          "details": true,
          "hotlist": true,
          "calendar": true,
          "studies": [
            "MASimple@tv-basicstudies",
            "RSI@tv-basicstudies",
            "MACD@tv-basicstudies"
          ]
        });
      }
    };

    return () => {
      const existingScript = document.querySelector('script[src="https://s3.tradingview.com/tv.js"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, [containerId]);

  return (
    <div className="tradingview-widget-container" ref={containerRef} style={{ height: height, width: "100%" }}>
      <div id={containerId} style={{ height: "calc(100% - 32px)", width: "100%" }}></div>
    </div>
  );
};

export default AdvancedChartWidget;


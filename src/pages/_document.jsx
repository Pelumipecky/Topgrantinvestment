import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang='en'>
      <Head>
        <meta charSet="UTF-8"/>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge"/>
          <meta name="theme-color" content='#003459'/>
        <meta name="title" content="Growing your wealth, one investment at a time"></meta>
        <meta name="description" content="Grant Union Investment is a trusted, regulation-forward binary and cryptocurrency trading company delivering dependable growth."/>
        <meta name="keywords" content="Grant Union Investment, grantunioninvestment.com, binary trading, Broker, forex trading, Investment, forex investment, Trusted investment platforms, Egypt investment platforms, US investment platforms, UK investment platforms, Paying websites, investment websites, trusted investment platform."/>
        <meta name="robots" content="index"></meta>
        <meta property="og:type" content="website"></meta>
        <meta property="og:title" content="Growing your wealth, one investment at a time"></meta>
        <meta property="og:description" content="Grant Union Investment is a trusted, regulation-forward binary and cryptocurrency trading company delivering dependable growth."/>
        <meta property="twitter:card" content="summary_large_image"></meta>
        <meta property="twitter:url" content="/"></meta>
        <link rel="icon" href="/grant-union-icon.png"/>
        <link rel="apple-touch-icon" href="/grant-union-icon.png"/>
        <meta property="og:image" content="/grant-union-icon.png"/>
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Alegreya+Sans:wght@100;300;400;500;700;800;900&display=swap"
          as="style"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          as="style"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700;800&display=swap"
          as="style"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Alegreya+Sans:wght@100;300;400;500;700;800;900&display=swap"
          media="print"
          crossOrigin="anonymous"
          onLoad="this.media='all'"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          media="print"
          crossOrigin="anonymous"
          onLoad="this.media='all'"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700;800&display=swap"
          media="print"
          crossOrigin="anonymous"
          onLoad="this.media='all'"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Plan Configuration (Hardcoded from src/utils/planConfig.js for script usage)
const PLANS = [
  {
    name: "3-Day Plan",
    duration: "3 days",
    dailyRate: "3%",
    min: "$100",
    max: "$999",
    bonus: "10%"
  },
  {
    name: "7-Day Plan",
    duration: "7 days",
    dailyRate: "3%",
    min: "$599",
    max: "$3,999",
    bonus: "10%"
  },
  {
    name: "12-Day Plan",
    duration: "12 days",
    dailyRate: "3.5%",
    min: "$1,000",
    max: "$5,000",
    bonus: "10%"
  },
  {
    name: "15-Day Plan",
    duration: "15 days",
    dailyRate: "4%",
    min: "$3,000",
    max: "$9,000",
    bonus: "10%"
  },
  {
    name: "3-Month Plan",
    duration: "90 days",
    dailyRate: "4%",
    min: "$5,000",
    max: "$15,000",
    bonus: "10%"
  },
  {
    name: "6-Month Plan",
    duration: "180 days",
    dailyRate: "5%",
    min: "$15,999",
    max: "Unlimited",
    bonus: "10%"
  }
];

const LANGUAGES = {
  en: {
    title: "Grant Union Investment Guide",
    aboutCompany: {
      title: "About Grant Union",
      content: [
        "Grant Union is a professional trading company specializing in cryptocurrency trading, forex trading, gold, and real estate investments. Our expert team of professional traders works diligently to maximize returns on your Bitcoin investments.",
        "",
        "INVESTMENT PLANS & RETURNS:",
        "The company offers daily commission based on your investment plan. With a minimum deposit of just $100, you can start earning. After your investment period, you can choose to withdraw both your capital and earnings, or reinvest for continued growth.",
        "",
        "Our Investment Plans:",
        "• 3-Day Plan: 3% daily commission",
        "• 7-Day Plan: 3% daily commission",
        "• 12-Day Plan: 3.5% daily commission",
        "• 15-Day Plan: 4% daily commission",
        "• 3-Month Plan: 4% daily commission",
        "• 6-Month Plan: 5% daily commission",
        "",
        "Example: If you invest $100 in the 3-day plan at 3% daily, after 3 days you'll earn $9.00. You can then choose to withdraw your capital and earnings or reinvest.",
        "",
        "REFERRAL COMMISSION:",
        "Grant Union offers an unlimited 10% referral commission to all investors! You earn 10% of every deposit made by anyone who registers using your referral link.",
        "",
        "HOW IT WORKS:",
        "When you invest with Grant Union, our professional team of traders trades your Bitcoin for the duration of your chosen plan (e.g., 3 days). After the investment period, your capital and earnings are transferred to your back office, where you can choose to withdraw or reinvest.",
        "",
        "PAYMENT METHODS:",
        "Grant Union uses Bitcoin and USDT for all transactions on the platform, ensuring fast, secure, and global accessibility.",
        "",
        "WITHDRAWAL PROCESS:",
        "Withdrawals are quick and efficient. The process takes only a few minutes, and at most, the company takes approximately 24 hours to approve any transaction."
      ]
    },
    intro: "Welcome to Grant Union, the world's premier investment and trading platform. We are committed to providing you with a secure, transparent, and profitable investment experience.",
    howToDeposit: {
      title: "How to Make a Deposit",
      steps: [
        "1. Log in to your Grant Union account.",
        "2. Navigate to the 'Deposit' section.",
        "3. Select your preferred cryptocurrency (Bitcoin, Ethereum, or USDT).",
        "4. Copy the wallet address provided or scan the QR code.",
        "5. Send the exact amount you wish to invest from your crypto wallet.",
        "6. Your deposit will be credited automatically after network confirmation."
      ]
    },
    packages: {
      title: "Investment Packages",
      headers: ["Plan Name", "Duration", "Daily Rate", "Min Deposit", "Max Deposit"]
    },
    withdrawal: {
      title: "Withdrawal Process",
      content: "Withdrawals are simple and fast. Once your investment term is complete, or you have accrued earnings, navigate to the 'Withdraw' section. Enter the amount and your wallet address. Requests are processed after admin approval."
    }
  },
  es: {
    title: "Guía de Inversión Grant Union",
    aboutCompany: {
      title: "Acerca de Grant Union",
      content: [
        "Grant Union es una empresa comercial profesional especializada en comercio de criptomonedas, comercio de divisas, oro e inversiones inmobiliarias. Nuestro equipo experto de traders profesionales trabaja diligentemente para maximizar los retornos de sus inversiones en Bitcoin.",
        "",
        "PLANES Y RENDIMIENTOS DE INVERSIÓN:",
        "La compañía ofrece comisión diaria basada en su plan de inversión. Con un depósito mínimo de solo $100, puede comenzar a ganar. Después de su período de inversión, puede elegir retirar tanto su capital como sus ganancias, o reinvertir para un crecimiento continuo.",
        "",
        "Nuestros Planes de Inversión:",
        "• Plan de 3 Días: 3% de comisión diaria",
        "• Plan de 7 Días: 3% de comisión diaria",
        "• Plan de 12 Días: 3.5% de comisión diaria",
        "• Plan de 15 Días: 4% de comisión diaria",
        "• Plan de 3 Meses: 4% de comisión diaria",
        "• Plan de 6 Meses: 5% de comisión diaria",
        "",
        "Ejemplo: Si invierte $100 en el plan de 3 días al 3% diario, después de 3 días ganará $9.00. Luego puede optar por retirar su capital y ganancias o reinvertir.",
        "",
        "COMISIÓN POR REFERIDOS:",
        "¡Grant Union ofrece una comisión ilimitada del 10% por referidos a todos los inversores! Gana el 10% de cada depósito realizado por cualquier persona que se registre usando su enlace de referido.",
        "",
        "CÓMO FUNCIONA:",
        "Cuando invierte con Grant Union, nuestro equipo profesional de traders negocia su Bitcoin durante la duración de su plan elegido (por ejemplo, 3 días). Después del período de inversión, su capital y ganancias se transfieren a su back office, donde puede elegir retirar o reinvertir.",
        "",
        "MÉTODOS DE PAGO:",
        "Grant Union utiliza Bitcoin y USDT para todas las transacciones en la plataforma, garantizando accesibilidad rápida, segura y global.",
        "",
        "PROCESO DE RETIRO:",
        "Los retiros son rápidos y eficientes. El proceso toma solo unos minutos, y como máximo, la compañía tarda aproximadamente 24 horas en aprobar cualquier transacción."
      ]
    },
    intro: "Bienvenido a Grant Union, la plataforma de inversión y comercio líder en el mundo. Nos comprometemos a brindarle una experiencia de inversión segura, transparente y rentable.",
    howToDeposit: {
      title: "Cómo hacer un depósito",
      steps: [
        "1. Inicie sesión en su cuenta de Grant Union.",
        "2. Vaya a la sección 'Depósito'.",
        "3. Seleccione su criptomoneda preferida (Bitcoin, Ethereum o USDT).",
        "4. Copie la dirección de la billetera proporcionada o escanee el código QR.",
        "5. Envíe la cantidad exacta que desea invertir desde su billetera criptográfica.",
        "6. Su depósito se acreditará automáticamente después de la confirmación de la red."
      ]
    },
    packages: {
      title: "Paquetes de Inversión",
      headers: ["Plan", "Duración", "Tasa Diaria", "Mínimo", "Máximo"]
    },
    withdrawal: {
      title: "Proceso de Retiro",
      content: "Los retiros son simples y rápidos. Una vez que finalice su plazo de inversión o haya acumulado ganancias, vaya a la sección 'Retirar'. Ingrese el monto y la dirección de su billetera. Las solicitudes se procesan después de la aprobación del administrador."
    }
  },
  fr: {
    title: "Guide d'Investissement Grant Union",
    aboutCompany: {
      title: "À propos de Grant Union",
      content: [
        "Grant Union est une société de trading professionnelle spécialisée dans le trading de crypto-monnaies, le trading forex, l'or et les investissements immobiliers. Notre équipe d'experts traders professionnels travaille avec diligence pour maximiser les rendements de vos investissements en Bitcoin.",
        "",
        "PLANS ET RENDEMENTS D'INVESTISSEMENT:",
        "La société offre une commission quotidienne basée sur votre plan d'investissement. Avec un dépôt minimum de seulement 100 $, vous pouvez commencer à gagner. Après votre période d'investissement, vous pouvez choisir de retirer votre capital et vos gains, ou de réinvestir pour une croissance continue.",
        "",
        "Nos Plans d'Investissement:",
        "• Plan de 3 Jours: 3% de commission quotidienne",
        "• Plan de 7 Jours: 3% de commission quotidienne",
        "• Plan de 12 Jours: 3,5% de commission quotidienne",
        "• Plan de 15 Jours: 4% de commission quotidienne",
        "• Plan de 3 Mois: 4% de commission quotidienne",
        "• Plan de 6 Mois: 5% de commission quotidienne",
        "",
        "Exemple: Si vous investissez 100 $ dans le plan de 3 jours à 3% par jour, après 3 jours vous gagnerez 9,00 $. Vous pouvez ensuite choisir de retirer votre capital et vos gains ou de réinvestir.",
        "",
        "COMMISSION DE PARRAINAGE:",
        "Grant Union offre une commission de parrainage illimitée de 10% à tous les investisseurs! Vous gagnez 10% de chaque dépôt effectué par toute personne qui s'inscrit en utilisant votre lien de parrainage.",
        "",
        "COMMENT ÇA FONCTIONNE:",
        "Lorsque vous investissez avec Grant Union, notre équipe professionnelle de traders négocie votre Bitcoin pendant la durée de votre plan choisi (par exemple, 3 jours). Après la période d'investissement, votre capital et vos gains sont transférés dans votre back office, où vous pouvez choisir de retirer ou de réinvestir.",
        "",
        "MÉTHODES DE PAIEMENT:",
        "Grant Union utilise Bitcoin et USDT pour toutes les transactions sur la plateforme, garantissant une accessibilité rapide, sécurisée et mondiale.",
        "",
        "PROCESSUS DE RETRAIT:",
        "Les retraits sont rapides et efficaces. Le processus ne prend que quelques minutes, et au maximum, la société prend environ 24 heures pour approuver toute transaction."
      ]
    },
    intro: "Bienvenue chez Grant Union, la première plateforme d'investissement et de trading au monde. Nous nous engageons à vous offrir une expérience d'investissement sécurisée, transparente et rentable.",
    howToDeposit: {
      title: "Comment faire un dépôt",
      steps: [
        "1. Connectez-vous à votre compte Grant Union.",
        "2. Accédez à la section 'Dépôt'.",
        "3. Sélectionnez votre crypto-monnaie préférée (Bitcoin, Ethereum ou USDT).",
        "4. Copiez l'adresse du portefeuille fournie ou scannez le code QR.",
        "5. Envoyez le montant exact que vous souhaitez investir depuis votre portefeuille crypto.",
        "6. Votre dépôt sera crédité automatiquement après confirmation du réseau."
      ]
    },
    packages: {
      title: "Forfaits d'Investissement",
      headers: ["Plan", "Durée", "Taux Journalier", "Min", "Max"]
    },
    withdrawal: {
      title: "Processus de Retrait",
      content: "Les retraits sont simples et rapides. Une fois votre terme d'investissement terminé ou vos gains accumulés, accédez à la section 'Retrait'. Entrez le montant et l'adresse de votre portefeuille. Les demandes sont traitées après approbation de l'administrateur."
    }
  },
  de: {
    title: "Grant Union Anlageführer",
    aboutCompany: {
      title: "Über Grant Union",
      content: [
        "Grant Union ist ein professionelles Handelsunternehmen, das sich auf Kryptowährungshandel, Forex-Handel, Gold und Immobilieninvestitionen spezialisiert hat. Unser Expertenteam professioneller Händler arbeitet fleißig daran, die Renditen Ihrer Bitcoin-Investitionen zu maximieren.",
        "",
        "INVESTITIONSPLÄNE UND RENDITEN:",
        "Das Unternehmen bietet tägliche Provisionen basierend auf Ihrem Investitionsplan. Mit einer Mindesteinzahlung von nur 100 $ können Sie mit dem Verdienen beginnen. Nach Ihrer Investitionsperiode können Sie wählen, ob Sie Ihr Kapital und Ihre Gewinne abheben oder für weiteres Wachstum reinvestieren möchten.",
        "",
        "Unsere Investitionspläne:",
        "• 3-Tage-Plan: 3% tägliche Provision",
        "• 7-Tage-Plan: 3% tägliche Provision",
        "• 12-Tage-Plan: 3,5% tägliche Provision",
        "• 15-Tage-Plan: 4% tägliche Provision",
        "• 3-Monats-Plan: 4% tägliche Provision",
        "• 6-Monats-Plan: 5% tägliche Provision",
        "",
        "Beispiel: Wenn Sie 100 $ im 3-Tage-Plan mit 3% täglich investieren, verdienen Sie nach 3 Tagen 9,00 $. Sie können dann wählen, Ihr Kapital und Ihre Gewinne abzuheben oder zu reinvestieren.",
        "",
        "EMPFEHLUNGSPROVISION:",
        "Grant Union bietet allen Investoren eine unbegrenzte 10% Empfehlungsprovision! Sie verdienen 10% von jeder Einzahlung, die von jemandem getätigt wird, der sich über Ihren Empfehlungslink registriert.",
        "",
        "WIE ES FUNKTIONIERT:",
        "Wenn Sie mit Grant Union investieren, handelt unser professionelles Händlerteam Ihr Bitcoin für die Dauer Ihres gewählten Plans (z.B. 3 Tage). Nach der Investitionsperiode werden Ihr Kapital und Ihre Gewinne in Ihr Back Office übertragen, wo Sie wählen können, ob Sie abheben oder reinvestieren möchten.",
        "",
        "ZAHLUNGSMETHODEN:",
        "Grant Union verwendet Bitcoin und USDT für alle Transaktionen auf der Plattform und gewährleistet schnelle, sichere und globale Zugänglichkeit.",
        "",
        "AUSZAHLUNGSPROZESS:",
        "Auszahlungen sind schnell und effizient. Der Prozess dauert nur wenige Minuten, und höchstens benötigt das Unternehmen etwa 24 Stunden, um eine Transaktion zu genehmigen."
      ]
    },
    intro: "Willkommen bei Grant Union, der weltweit führenden Investitions- und Handelsplattform. Wir verpflichten uns, Ihnen ein sicheres, transparentes und profitables Anlageerlebnis zu bieten.",
    howToDeposit: {
      title: "Wie man eine Einzahlung tätigt",
      steps: [
        "1. Melden Sie sich bei Ihrem Grant Union-Konto an.",
        "2. Navigieren Sie zum Bereich 'Einzahlung'.",
        "3. Wählen Sie Ihre bevorzugte Kryptowährung (Bitcoin, Ethereum oder USDT).",
        "4. Kopieren Sie die angegebene Wallet-Adresse oder scannen Sie den QR-Code.",
        "5. Senden Sie den genauen Betrag, den Sie investieren möchten, von Ihrer Krypto-Wallet.",
        "6. Ihre Einzahlung wird nach Netzwerkbestätigung automatisch gutgeschrieben."
      ]
    },
    packages: {
      title: "Investitionspakete",
      headers: ["Plan", "Dauer", "Tagesrate", "Min", "Max"]
    },
    withdrawal: {
      title: "Auszahlungsprozess",
      content: "Auszahlungen sind einfach und schnell. Sobald Ihre Investitionslaufzeit beendet ist oder Sie Gewinne erzielt haben, navigieren Sie zum Bereich 'Auszahlen'. Geben Sie den Betrag und Ihre Wallet-Adresse ein. Anfragen werden nach Genehmigung durch den Administrator bearbeitet."
    }
  },
  zh: {
    title: "Grant Union 投资指南",
    aboutCompany: {
      title: "关于 Grant Union",
      content: [
        "Grant Union 是一家专业的交易公司，专门从事加密货币交易、外汇交易、黄金和房地产投资。我们的专业交易团队努力工作，以最大化您的比特币投资回报。",
        "",
        "投资计划和回报：",
        "公司根据您的投资计划提供每日佣金。只需最低存款100美元，您就可以开始赚钱。投资期结束后，您可以选择提取本金和收益，或重新投资以实现持续增长。",
        "",
        "我们的投资计划：",
        "• 3天计划：每日3%佣金",
        "• 7天计划：每日3%佣金",
        "• 12天计划：每日3.5%佣金",
        "• 15天计划：每日4%佣金",
        "• 3个月计划：每日4%佣金",
        "• 6个月计划：每日5%佣金",
        "",
        "示例：如果您在3天计划中投资100美元，每日3%，3天后您将赚取9.00美元。然后您可以选择提取本金和收益或重新投资。",
        "",
        "推荐佣金：",
        "Grant Union 为所有投资者提供无限的10%推荐佣金！使用您的推荐链接注册的任何人所做的每笔存款，您都能赚取10%。",
        "",
        "工作原理：",
        "当您在 Grant Union 投资时，我们的专业交易团队会在您选择的计划期限内（例如3天）交易您的比特币。投资期结束后，您的本金和收益将转入您的后台办公室，您可以选择提取或重新投资。",
        "",
        "支付方式：",
        "Grant Union 使用比特币和 USDT 进行平台上的所有交易，确保快速、安全和全球可访问性。",
        "",
        "提款流程：",
        "提款快速高效。该过程只需几分钟，最多公司需要大约24小时来批准任何交易。"
      ]
    },
    intro: "欢迎来到 Grant Union，全球首屈一指的投资和交易平台。我们致力于为您提供安全、透明和有利可图的投资体验。",
    howToDeposit: {
      title: "如何存款",
      steps: [
        "1. 登录您的 Grant Union 账户。",
        "2. 导航至“存款”部分。",
        "3. 选择您喜欢的加密货币（比特币、以太坊或 USDT）。",
        "4. 复制提供的钱包地址或扫描二维码。",
        "5. 从您的加密钱包发送您希望投资的确切金额。",
        "6. 您的存款将在网络确认后自动记入。"
      ]
    },
    packages: {
      title: "投资套餐",
      headers: ["计划", "持续时间", "日利率", "最低", "最高"]
    },
    withdrawal: {
      title: "提款流程",
      content: "提款简单快捷。一旦您的投资期限结束，或者您已累积收益，请导航至“提款”部分。输入金额和您的钱包地址。请求将在管理员批准后处理。"
    }
  },
  ru: {
    title: "Руководство по инвестициям Grant Union",
    aboutCompany: {
      title: "О Grant Union",
      content: [
        "Grant Union - это профессиональная торговая компания, специализирующаяся на торговле криптовалютами, торговле на рынке Forex, золоте и инвестициях в недвижимость. Наша команда профессиональных трейдеров усердно работает, чтобы максимизировать доходность ваших инвестиций в биткоин.",
        "",
        "ИНВЕСТИЦИОННЫЕ ПЛАНЫ И ДОХОДНОСТЬ:",
        "Компания предлагает ежедневную комиссию в зависимости от вашего инвестиционного плана. С минимальным депозитом всего в 100 долларов вы можете начать зарабатывать. После окончания инвестиционного периода вы можете выбрать, вывести ли свой капитал и прибыль или реинвестировать для дальнейшего роста.",
        "",
        "Наши инвестиционные планы:",
        "• План на 3 дня: 3% ежедневная комиссия",
        "• План на 7 дней: 3% ежедневная комиссия",
        "• План на 12 дней: 3,5% ежедневная комиссия",
        "• План на 15 дней: 4% ежедневная комиссия",
        "• План на 3 месяца: 4% ежедневная комиссия",
        "• План на 6 месяцев: 5% ежедневная комиссия",
        "",
        "Пример: Если вы инвестируете 100 долларов в 3-дневный план под 3% в день, через 3 дня вы заработаете 9,00 долларов. Затем вы можете выбрать, вывести свой капитал и прибыль или реинвестировать.",
        "",
        "РЕФЕРАЛЬНАЯ КОМИССИЯ:",
        "Grant Union предлагает неограниченную реферальную комиссию в размере 10% всем инвесторам! Вы зарабатываете 10% с каждого депозита, сделанного любым человеком, зарегистрировавшимся по вашей реферальной ссылке.",
        "",
        "КАК ЭТО РАБОТАЕТ:",
        "Когда вы инвестируете с Grant Union, наша профессиональная команда трейдеров торгует вашим биткоином в течение выбранного вами плана (например, 3 дня). После инвестиционного периода ваш капитал и прибыль переводятся в ваш бэк-офис, где вы можете выбрать вывод или реинвестирование.",
        "",
        "СПОСОБЫ ОПЛАТЫ:",
        "Grant Union использует биткоин и USDT для всех транзакций на платформе, обеспечивая быструю, безопасную и глобальную доступность.",
        "",
        "ПРОЦЕСС ВЫВОДА СРЕДСТВ:",
        "Выводы быстры и эффективны. Процесс занимает всего несколько минут, и максимум компания занимает примерно 24 часа на утверждение любой транзакции."
      ]
    },
    intro: "Добро пожаловать в Grant Union, ведущую мировую инвестиционную и торговую платформу. Мы стремимся предоставить вам безопасный, прозрачный и прибыльный инвестиционный опыт.",
    howToDeposit: {
      title: "Как сделать депозит",
      steps: [
        "1. Войдите в свою учетную запись Grant Union.",
        "2. Перейдите в раздел 'Депозит'.",
        "3. Выберите предпочитаемую криптовалюту (Bitcoin, Ethereum или USDT).",
        "4. Скопируйте предоставленный адрес кошелька или отсканируйте QR-код.",
        "5. Отправьте точную сумму, которую вы хотите инвестировать, со своего криптокошелька.",
        "6. Ваш депозит будет зачислен автоматически после подтверждения сети."
      ]
    },
    packages: {
      title: "Инвестиционные пакеты",
      headers: ["План", "Срок", "Ставка", "Мин", "Макс"]
    },
    withdrawal: {
      title: "Процесс вывода средств",
      content: "Вывод средств прост и быстр. Как только срок ваших инвестиций истечет или вы накопите прибыль, перейдите в раздел 'Вывод средств'. Введите сумму и адрес вашего кошелька. Запросы обрабатываются после одобрения администратором."
    }
  },
  ar: {
    title: "دليل استثمار Grant Union",
    aboutCompany: {
      title: "حول Grant Union",
      content: [
        "Grant Union هي شركة تداول محترفة متخصصة في تداول العملات المشفرة وتداول الفوركس والذهب والاستثمارات العقارية. يعمل فريقنا من المتداولين المحترفين بجد لتعظيم عوائد استثماراتك في البيتكوين.",
        "",
        "خطط وعوائد الاستثمار:",
        "تقدم الشركة عمولة يومية بناءً على خطة الاستثمار الخاصة بك. بحد أدنى للإيداع يبلغ 100 دولار فقط، يمكنك البدء في الكسب. بعد فترة الاستثمار، يمكنك اختيار سحب رأس المال والأرباح، أو إعادة الاستثمار للنمو المستمر.",
        "",
        "خطط الاستثمار لدينا:",
        "• خطة 3 أيام: عمولة يومية 3%",
        "• خطة 7 أيام: عمولة يومية 3%",
        "• خطة 12 يوم: عمولة يومية 3.5%",
        "• خطة 15 يوم: عمولة يومية 4%",
        "• خطة 3 أشهر: عمولة يومية 4%",
        "• خطة 6 أشهر: عمولة يومية 5%",
        "",
        "مثال: إذا استثمرت 100 دولار في خطة 3 أيام بنسبة 3% يومياً، بعد 3 أيام ستكسب 9.00 دولار. يمكنك بعد ذلك اختيار سحب رأس المال والأرباح أو إعادة الاستثمار.",
        "",
        "عمولة الإحالة:",
        "تقدم Grant Union عمولة إحالة غير محدودة بنسبة 10% لجميع المستثمرين! تكسب 10% من كل إيداع يقوم به أي شخص يسجل باستخدام رابط الإحالة الخاص بك.",
        "",
        "كيف يعمل:",
        "عندما تستثمر مع Grant Union، يقوم فريقنا المحترف من المتداولين بتداول البيتكوين الخاص بك طوال مدة الخطة التي اخترتها (على سبيل المثال، 3 أيام). بعد فترة الاستثمار، يتم تحويل رأس المال والأرباح إلى مكتبك الخلفي، حيث يمكنك اختيار السحب أو إعادة الاستثمار.",
        "",
        "طرق الدفع:",
        "تستخدم Grant Union البيتكوين و USDT لجميع المعاملات على المنصة، مما يضمن إمكانية الوصول السريعة والآمنة والعالمية.",
        "",
        "عملية السحب:",
        "عمليات السحب سريعة وفعالة. تستغرق العملية بضع دقائق فقط، وفي أقصى الحالات تستغرق الشركة حوالي 24 ساعة للموافقة على أي معاملة."
      ]
    },
    intro: "مرحبًا بكم في Grant Union، منصة الاستثمار والتداول الرائدة في العالم. نحن ملتزمون بتزويدك بتجربة استثمارية آمنة وشفافة ومربحة.",
    howToDeposit: {
      title: "كيفية الإيداع",
      steps: [
        "1. قم بتسجيل الدخول إلى حساب Grant Union الخاص بك.",
        "2. انتقل إلى قسم 'الإيداع'.",
        "3. اختر العملة المشفرة المفضلة لديك (Bitcoin أو Ethereum أو USDT).",
        "4. انسخ عنوان المحفظة المقدم أو امسح رمز الاستجابة السريعة ضوئيًا.",
        "5. أرسل المبلغ المحدد الذي ترغب في استثماره من محفظتك المشفرة.",
        "6. سيتم قيد إيداعك تلقائيًا بعد تأكيد الشبكة."
      ]
    },
    packages: {
      title: "باقات الاستثمار",
      headers: ["الخطة", "المدة", "المعدل اليومي", "الحد الأدنى", "الحد الأقصى"]
    },
    withdrawal: {
      title: "عملية السحب",
      content: "عمليات السحب بسيطة وسريعة. بمجرد اكتمال مدة استثمارك، أو تراكم الأرباح، انتقل إلى قسم 'السحب'. أدخل المبلغ وعنوان محفظتك. تتم معالجة الطلبات بعد موافقة المسؤول."
    }
  }
};

// Font setup (using standard fonts for simplicity, might need custom fonts for non-latin scripts in a real production env)
// For this script, we'll rely on PDFKit's standard fonts for Latin, and try to handle others gracefully or use a fallback font if available.
// Note: PDFKit standard fonts don't support Chinese/Arabic/Russian characters well without loading a specific font file.
// To make this robust without external font files, we might have limitations. 
// However, for the purpose of this task, we will try to generate them. If characters are missing, we'd typically need a .ttf file.
// I will assume standard font usage. If special chars fail, I'll note that a font file is needed.
// Actually, to ensure it works for all languages, I should probably use a font that supports unicode if possible, but I don't have one handy in the env.
// I will proceed with standard generation.

const generatePDF = (langCode, content) => {
  const doc = new PDFDocument();
  const filePath = path.join(__dirname, '../public/downloads', `guide-${langCode}.pdf`);
  
  doc.pipe(fs.createWriteStream(filePath));

  // Title
  doc.fontSize(25).text(content.title, { align: 'center' });
  doc.moveDown();

  // Intro
  doc.fontSize(12).text(content.intro, { align: 'left' });
  doc.moveDown(2);

  // About Company Section
  doc.fontSize(18).text(content.aboutCompany.title);
  doc.moveDown(0.5);
  doc.fontSize(12);
  content.aboutCompany.content.forEach(line => {
    if (line === "") {
      doc.moveDown(0.3);
    } else {
      doc.text(line, { align: 'left' });
      doc.moveDown(0.2);
    }
  });
  doc.moveDown(2);

  // How to Deposit
  doc.fontSize(18).text(content.howToDeposit.title);
  doc.moveDown(0.5);
  doc.fontSize(12);
  content.howToDeposit.steps.forEach(step => {
    doc.text(step);
    doc.moveDown(0.2);
  });
  doc.moveDown(2);

  // Packages
  doc.fontSize(18).text(content.packages.title);
  doc.moveDown(0.5);
  
  // Simple list for packages instead of complex table to avoid layout issues
  PLANS.forEach(plan => {
    doc.fontSize(14).text(plan.name, { underline: true });
    doc.fontSize(12).text(`${content.packages.headers[1]}: ${plan.duration}`);
    doc.text(`${content.packages.headers[2]}: ${plan.dailyRate}`);
    doc.text(`${content.packages.headers[3]}: ${plan.min}`);
    doc.text(`${content.packages.headers[4]}: ${plan.max}`);
    doc.moveDown(1);
  });

  // Withdrawal
  doc.fontSize(18).text(content.withdrawal.title);
  doc.moveDown(0.5);
  doc.fontSize(12).text(content.withdrawal.content);

  doc.end();
  console.log(`Generated guide-${langCode}.pdf`);
};

// Generate for all languages
Object.keys(LANGUAGES).forEach(lang => {
  // Note: For languages like Chinese (zh), Arabic (ar), Russian (ru), PDFKit requires a font that supports those characters.
  // Without a custom font, these will likely render as squares or garbage.
  // Since I cannot easily upload a font file here, I will generate them but they might be imperfect without the font.
  // For a real deployment, you would need to add a font file (e.g. NotoSans.ttf) and load it: doc.font('path/to/font.ttf')
  
  // For now, we generate.
  try {
      generatePDF(lang, LANGUAGES[lang]);
  } catch (e) {
      console.error(`Failed to generate for ${lang}:`, e);
  }
});

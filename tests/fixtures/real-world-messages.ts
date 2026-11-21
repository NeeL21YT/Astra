/**
 * A sample of real SMS messages received on the project author's own phone, with personal and
 * identifying details removed. Unlike the synthetic evaluation set, nobody wrote these to test the
 * rules, so they show what actually arrives in an Indian inbox: mostly betting and casino promotions,
 * fake "credited / withdraw" and fake order-tracking messages, and a large number of genuine
 * one-time codes. They were taken from an export of about 280 messages and the sample was chosen to
 * cover each kind seen (many near-duplicates were left out).
 *
 * What was changed before saving them here:
 *  - account, customer and phone numbers, names and email addresses were replaced with placeholders;
 *  - the web addresses of betting, casino and other private sites were replaced with `.example`
 *    addresses (public link-shortener domains and a few big-brand domains were kept, with a made-up
 *    path, because they matter for detection);
 *  - company names of ordinary senders were replaced with "Example ...". Names of well-known betting
 *    brands were kept as written because spammers use them, and some rules look for them.
 * The labels are the author's own judgment and are not verified by the senders. "unclear" messages
 * are not counted in any score.
 */
export type RealLabel = "scam" | "spam" | "suspicious" | "genuine" | "unclear";

export type RealMessage = {
  id: string;
  text: string;
  label: RealLabel;
  note: string;
};

export const REAL_MESSAGES: RealMessage[] = [
  {
    "id": "scam-cashback-1",
    "text": "Dear Member, your appointment is booked at Your cashback of Rs.3757 credited to your A/C(1234567890). on Pls click withdraw: bit.ly/AbC1234",
    "label": "scam",
    "note": "Fake cashback with a shortened 'withdraw' link; the text is garbled on purpose."
  },
  {
    "id": "scam-cashback-2",
    "text": "Dear Member, Important information regarding Your cash back of Rs.7893 credited to your account(1234567890). Pls click withdraw: bit.ly/AbC1234",
    "label": "scam",
    "note": "Same fake cashback template."
  },
  {
    "id": "scam-credit-1",
    "text": "Account(123***7890) credited Rs.10214 Withdraw process @9pm today Click on39.example/nPy-1234567890",
    "label": "scam",
    "note": "Fake 'credited, withdraw today at 9pm' lure with a link that carries the account number."
  },
  {
    "id": "scam-credit-2",
    "text": "S12DtKeySolu Account(123***7890) credited Rs.10974 Withdraw process @9pm today Click sq40.example/eCN-1234567890 Example",
    "label": "scam",
    "note": "Same lure with junk text at the start and end."
  },
  {
    "id": "scam-credit-3",
    "text": "Account(123***7890) credited Rs.10971 Withdraw process  9pm today Click bit.ly/AbC1234 ReqbyCommentsTimetaken",
    "label": "scam",
    "note": "Same lure on a public shortener."
  },
  {
    "id": "scam-credit-4",
    "text": "DtDearClientTrade Your cash back of Rs.10000 credited to your account(1234567890). Click to view bit.ly/AbC1234 StrkPriceEXAMPLE",
    "label": "scam",
    "note": "Fake broker-style cashback message."
  },
  {
    "id": "scam-credit-5",
    "text": "DateTradingAcBaland A/C:1234567890 Received:Rs.10864 on 9/4/2026. New Bal:Rs.31913. Click to view full statement: bit.ly/AbC1234?92 EXAMPLE",
    "label": "scam",
    "note": "Fake 'amount received' statement from a template with the reader's number dropped in."
  },
  {
    "id": "scam-credit-6",
    "text": "Dear Investor, Your value in Acc no Account: (1234567890) Received: Rs.13017 Date: 24-Jul Balance: Rs.36604 View details bit.ly/AbC1234 EXAMPLE MFS",
    "label": "scam",
    "note": "Fake fund-house statement with a shortened link."
  },
  {
    "id": "scam-credit-7",
    "text": "Capital Market: A/c:(1234567890) Received:Rs.13614 Bill :Net A/c Bal: Rs.35409. on 24-Jul for Client Code: View details bit.ly/AbC1234?6292 Example",
    "label": "scam",
    "note": "Fake stock-broker statement with a shortened link."
  },
  {
    "id": "scam-credit-8",
    "text": "CommissionChangedfromtoOperator Account 1234567890 Transfer Received: Rs 3850 Amount available in yourwallet Check now. bit.ly/AbC1234?6292 EXAMPLE",
    "label": "scam",
    "note": "Fake wallet credit with a shortened link and garbled words."
  },
  {
    "id": "scam-order-1",
    "text": "Dear user(1234567890) Wish You Very Happy your order is out for delivery today. Track live status Click bit.ly/AbC1234 Info By SMS",
    "label": "scam",
    "note": "Fake delivery tracking: the reader never placed an order, the number is dropped into a template, the link is shortened."
  },
  {
    "id": "scam-order-2",
    "text": "Vehicle: user(1234567890) has your order is out for delivery today. Location: Track live status Click bit.ly/AbC1234 on: - :Example",
    "label": "scam",
    "note": "Same fake delivery-tracking template."
  },
  {
    "id": "scam-order-3",
    "text": "Trades Conf. for UCC: - on:user(1234567890) your order is out for delivery today. Track live status Click bit.ly/AbC1234 EXAMPLE SECURITIES",
    "label": "scam",
    "note": "Same template wearing a broker's name."
  },
  {
    "id": "scam-order-4",
    "text": "SLBLendingRateExp user(1234567890). your order is out for delivery today. Track live status Click bit.ly/AbC1234?6292 Moreinfocall - EXAMPLE",
    "label": "scam",
    "note": "Same template with lending-rate junk words."
  },
  {
    "id": "scam-order-5",
    "text": "user(1234567890) got your order is out for delivery today. Marks in Track live status Click bit.ly/AbC1234?6292 TestFrom:Example School",
    "label": "scam",
    "note": "Same template wearing a school's name."
  },
  {
    "id": "scam-tradelure-1",
    "text": "Dear Trading A/c: ABCDEF Your TradeSummary Your bonus today! 200% FREE on first deposit! good luck to you Net Ledger Balance : cutt.ly/AbC12345 - EXAMPLE",
    "label": "scam",
    "note": "A betting bonus dressed up as a trade summary, with a shortened link."
  },
  {
    "id": "scam-invest-1",
    "text": "Greetings. You've successfully registered for our investment program. Unfortunately, we weren't able to get in touch with you. To reschedule a call with your account manager Example Person call this number 0123456789 or contact me on this email - person@example.com",
    "label": "scam",
    "note": "Cold investment-program outreach asking you to call back a number."
  },
  {
    "id": "scam-invest-2",
    "text": "Airtel Warning: SPAM | He learned calm setups and earned Rs 11,777 daily-now plans his future confidently https://bit.ly/AbC1234",
    "label": "scam",
    "note": "Telecom-flagged spam: 'earn thousands daily' trading lure with a shortened link."
  },
  {
    "id": "sus-social-reset-1",
    "text": "12345 Tap to re_set your Instagram passw0rd: https://ig.me/AbCdEf123",
    "label": "suspicious",
    "note": "A password-reset prompt with odd spelling (re_set, passw0rd) to slip past filters. The link is on a real Instagram domain, so it is not certain it is a scam."
  },
  {
    "id": "sus-uber-docs-1",
    "text": "Uber: Your document is expired. You will not have access to the Driver app until you have updated the required documents. AbCdEfGhIj",
    "label": "suspicious",
    "note": "Unsolicited 'your documents expired, you will lose access' threat with no way to verify."
  },
  {
    "id": "sus-paylater-1",
    "text": "14835 Just a reminder that your TikTok PayLater balance is overdue. Please settle your payment as soon as possible. You may pay here: https://www.tiktok.com/t/AbCdEfGhI/. Thank you",
    "label": "suspicious",
    "note": "An unexpected overdue-payment reminder with a pay link on a real domain."
  },
  {
    "id": "sus-corp-pass-1",
    "text": "55632Dear Colleague,\nPlease be advised that the corporate network password for your account EXAMPLEINT 55632 will expire in 5 days.\nRemember to change your password before the deadline in order to continue using company services - (corporate network access, mail, applications, etc.).\nThe guide is available on the One Click Portal , by typing in the search bar: \"Domain Password Change/Reset#v7r9",
    "label": "suspicious",
    "note": "A password-expiry notice with a deadline and no sender you can check, a common credential-phishing shape."
  },
  {
    "id": "sus-cibil-1",
    "text": "Due TODAY! Pay now & keep your CIBIL score safe:214135 ztpl",
    "label": "suspicious",
    "note": "A 'pay now or your credit score suffers' pressure line with no sender detail."
  },
  {
    "id": "sus-autopay-1",
    "text": "Your account has been successfully debited with ₹275609 on towards SPOTIFY INDIA PVT LTD UPI AutoPay, (abc123@example) - Example India",
    "label": "suspicious",
    "note": "A huge debit alert for a small subscription, a panic lure that makes people call a number."
  },
  {
    "id": "bet-1",
    "text": "169292 1win se ?1,000 reach ke andar hai. Lucky Jet VIP mein 3 jeet wali bets",
    "label": "spam",
    "note": "Betting promotion in Hinglish naming a known betting brand. No link."
  },
  {
    "id": "bet-2",
    "text": "IPL is live. Get a 100% bonus up to INR25,000 and start betting now.\nLimited time: go2.example/promo/65128\nExample",
    "label": "spam",
    "note": "Betting bonus tied to a cricket event."
  },
  {
    "id": "bet-3",
    "text": "01854 Your 150% bonus is waiting on EXAMPLEBET. Make your deposit today and get extra on your bonus account: examplebet.example/s/F1CvSs",
    "label": "spam",
    "note": "Bonus-waiting lure from a betting site."
  },
  {
    "id": "bet-4",
    "text": "42369 Grab 10 FS on the Lucky Wheel: Top up your account from 5420 INR min within 7 days. Details in PM on MelBet! https://mlb.example/GTyJ1zY ID#04428",
    "label": "spam",
    "note": "Free-spins lure with a top-up condition."
  },
  {
    "id": "bet-5",
    "text": "35171 40 FS for Royalty of Olympus: Claim within 3 days in Bonuses & Gifts, wager x20 within 3 days and enjoy your reward on MelBet! https://mlb.example/zS0PV1C ID#04428",
    "label": "spam",
    "note": "Free-spins lure with a wagering condition."
  },
  {
    "id": "bet-6",
    "text": "46707  Claim your 100 Free Spins + up to $500 bonus https://demo-bonus-test.example/8472",
    "label": "spam",
    "note": "Free spins plus a dollar bonus."
  },
  {
    "id": "bet-7",
    "text": "97645  Parimatch: Missed the 50 Free Bets? Get a 100% for IG up to Rs 30,000. Ride the storm before it fades! Bonus is here: http://maqpu.example/dnNyEK m1",
    "label": "spam",
    "note": "Free-bets lure naming a known betting brand."
  },
  {
    "id": "bet-8",
    "text": "Hi 872648.\nGet a 50% Sports bonus today, up to INR 10000! Code JOSH100.\nT&C apply www.godafa.example\nCall us back on +91 98765 43210\nDafabet",
    "label": "spam",
    "note": "Sports-bonus offer with a call-back number."
  },
  {
    "id": "bet-9",
    "text": "1234567899 Hi, deposit INR 500 or more in crypto and get INR 500 worth of crypto as a bonus. Only on Stake.example. Limited offer. Call back on +91 98765 43210",
    "label": "spam",
    "note": "Crypto-deposit bonus from a betting brand."
  },
  {
    "id": "bet-10",
    "text": "पहले डिपॉजिट का बोनस पाएं: https://slim.link/AbCdEf",
    "label": "spam",
    "note": "Hindi first-deposit bonus lure with a shortened link."
  },
  {
    "id": "bet-11",
    "text": "दूसरा डिपॉजिट: +50% और 35 फ्री स्पिन: https://slim.link/AbCdEf",
    "label": "spam",
    "note": "Hindi second-deposit bonus and free spins."
  },
  {
    "id": "bet-12",
    "text": "Tez888: 100% Welcome Bonus up to Rs75,000. Claim now: bit.ly/AbCd 89540",
    "label": "spam",
    "note": "Welcome-bonus lure on a shortened link."
  },
  {
    "id": "bet-13",
    "text": "242695 Double your money! Get + 100% Real Money up to 4,000 INR. Deposit from 300 INR. Only by the link: https://example.example/deposit",
    "label": "spam",
    "note": "'Double your money' deposit lure."
  },
  {
    "id": "bet-14",
    "text": "Lucky Star: 4,000 INR for your activity. The bonus is already credited and ready to use: https://lcky.example/pe60",
    "label": "spam",
    "note": "'Bonus already credited' lure."
  },
  {
    "id": "bet-15",
    "text": "MaxWin VIP: Your status secures a 100% bonus. Fund your balance with 7,500 INR+ to unlock it. https://s.winex.example/PIyWi",
    "label": "spam",
    "note": "VIP-status bonus lure asking for a large deposit."
  },
  {
    "id": "bet-16",
    "text": "06763 1win: You've received 150 FS. Claim them in the Bonuses section.\nhttps://1w.example/88bhkuqx",
    "label": "spam",
    "note": "Free-spins notice naming a known betting brand."
  },
  {
    "id": "bet-17",
    "text": "Magic Rummy is BACK! Play Rummy, Ludo, Poker, Teen Patti, Aviator & more. Your favourite games are waiting! Enjoy playing for fun with 24I¿07 support. Play now: www.magicrummy.example SSYMgE",
    "label": "spam",
    "note": "Real-money card-game promotion."
  },
  {
    "id": "bet-18",
    "text": "Roland Garros is live! Take part in the superprize draw! https://cli.co/AbCdEf",
    "label": "spam",
    "note": "Prize-draw lure tied to a sports event."
  },
  {
    "id": "bet-19",
    "text": "Emirates Draw: INR 280 Cr MEGA7 tonight! EASY6 won INR 38 Cr last Friday. Buy all 4 for a chance at 52 FREE EASY6 tickets. Buy Now: www.emiratesdraw.example",
    "label": "spam",
    "note": "Lottery promotion with huge prize figures."
  },
  {
    "id": "bet-20",
    "text": "Deposit on Betwinner with your iCash.example wallet and get 50% cashback - up to ₹600 back INSTANTLY in your wallet. Valid for all wallet deposits! Download the iCash.example App Now: https://wallet.example/IFFM",
    "label": "spam",
    "note": "Betting cashback lure naming a known betting brand."
  },
  {
    "id": "bet-21",
    "text": "Win 1,100 INR in the app! Claim it pn-up.example/JpYgUh",
    "label": "spam",
    "note": "'Win money in the app' lure."
  },
  {
    "id": "bet-22",
    "text": "Airtel Warning: SPAM | 77726 Join tonight & claim your Welcome Package! Sign up now! 370%+15. Code WSL1. http://cyplt.example/dXLpIj ID#35368",
    "label": "spam",
    "note": "Welcome-package gambling lure already flagged by the telecom company."
  },
  {
    "id": "bet-23",
    "text": "Hi,\nGet your 100% bonus up to 1 Lakh.\nSimply sel ect the bonus fr om the cashier to play\nT&C: Roobet.example/bonus-and-promotion-policy\nCall back on +91 98765 43210",
    "label": "spam",
    "note": "Betting bonus with letters split by spaces to dodge filters."
  },
  {
    "id": "bet-24",
    "text": "D3posit Bonus Up to 43%, D@ily Free $88, Click Link Below and Join Now \\n\n\nhttps://tinyurl.com/AbCdEfG",
    "label": "spam",
    "note": "Betting bonus with digits and symbols inside words to dodge filters."
  },
  {
    "id": "bet-25",
    "text": "Get Your Freebet + First Dep0sit B0nus! Want to know how? Find us on Tg melbetke and stay updated on all b0nuses and promo c0des https://mlbt.example/upltxwin",
    "label": "spam",
    "note": "Betting lure with zeros inside words to dodge filters."
  },
  {
    "id": "bet-26",
    "text": "Haziran firsatlari basladi. %100 + 50FS ile hemen yerini al! diceb.example/check1234567890",
    "label": "spam",
    "note": "Turkish betting bonus: another language entirely."
  },
  {
    "id": "bet-27",
    "text": "100 FB has been credited to Lucky Jet - activate them https://1wn.example/pcyl",
    "label": "spam",
    "note": "Free-bets-credited lure from a betting game."
  },
  {
    "id": "bet-28",
    "text": "94326 INR ki value ka gift pehle se hi aapke account mein hai! MOSTBET par prize ka jaldi se istemaal kren: ramb.example/eMV",
    "label": "spam",
    "note": "Hinglish 'gift already in your account' lure naming a known betting brand."
  },
  {
    "id": "bet-29",
    "text": "Apne top-up ke lie 150% ka gift lena na bhulen: ramb.example/nfnn",
    "label": "spam",
    "note": "Hinglish top-up gift lure."
  },
  {
    "id": "bet-30",
    "text": "33302 Bonus week starts at MelBet: deposit for 5 days in a row = 5 chances to claim FS for top games. https://mlb.example/A3Ztdj2",
    "label": "spam",
    "note": "Daily-deposit bonus lure."
  },
  {
    "id": "bet-31",
    "text": "781948 India, ready to play? Join the action with exciting live casino games, real dealers and nonstop entertainment! 18+ Play responsibly. https://www.bet365.example",
    "label": "spam",
    "note": "Live-casino promotion naming a known betting brand."
  },
  {
    "id": "bet-32",
    "text": "19109 🎰 You still have funds left in your account! Don't let your balance sit idle. Jump back into the action now:\n👉 [CTW] smsfv.example/l/tHvVk",
    "label": "spam",
    "note": "Win-back message that pushes you to gamble again."
  },
  {
    "id": "bet-33",
    "text": "Hi Example3102! Early Six You Win: If your team hits a 1st-over six but loses, we pay your qualifying bet as a winner. T&Cs apply.\nStake.example\nOpt-out: acc settings",
    "label": "spam",
    "note": "Cricket bet promotion naming a known betting brand."
  },
  {
    "id": "bet-34",
    "text": "VIP 1234567890:Fortune Garuda 500 up to 25000X & Aviator 17777X+ Claim Rs.8,888 recharge bonus. Join now: cutt.ly/AbCdEfGh eKyc Team Example",
    "label": "spam",
    "note": "Casino promotion with a 'recharge bonus' and a fake 'eKyc' sign-off."
  },
  {
    "id": "bet-35",
    "text": "Dear 9876543210, 10 FREE Example Garuda 500 plays! Win up to 25000X! Deposit Rs100, cashback up to Rs2777: ln.run/AbCdE OrderProducttypeValidityInitTeamExample",
    "label": "spam",
    "note": "Casino promotion: free plays, a huge win multiple, a small deposit and a shortened link."
  },
  {
    "id": "bet-36",
    "text": "examplebet: India vs. West Indies T20 series ka aakhri match. Yeh muqabla kis anjaam par pahunchega? https://examplebet.example/5z493347v3",
    "label": "spam",
    "note": "Betting promotion in Hinglish tied to a cricket match. The brand name is unknown to the rules."
  },
  {
    "id": "bet-37",
    "text": "123456XYZ12AB: 10 EUR जमा = 10 EUR FB, 22.11 तक https://spnb-bet.example/AbCdEf",
    "label": "spam",
    "note": "Betting promotion in Hindi and English: deposit money to get a free bet."
  },
  {
    "id": "bet-38",
    "text": "12345 You have an exclusive bonus in your EXAMPLE account. Log in now to use. https://bonus-example.example/EPIN ID#00123",
    "label": "spam",
    "note": "Betting-site 'bonus waiting in your account' lure."
  },
  {
    "id": "gen-otp-1",
    "text": "Your Google verification code is 0804",
    "label": "genuine",
    "note": "Plain one-time code."
  },
  {
    "id": "gen-otp-2",
    "text": "[TikTok] 413549 is your verification code, valid for 5 minutes. To keep your account safe, never forward this code.",
    "label": "genuine",
    "note": "One-time code with a 'never forward' warning."
  },
  {
    "id": "gen-otp-3",
    "text": "78353 do not pass your withdrawal key on to others",
    "label": "genuine",
    "note": "Code message from a site, with a safety line."
  },
  {
    "id": "gen-otp-4",
    "text": "Do not pass your withdrawal key 164156 on to others",
    "label": "genuine",
    "note": "Same, code in the message."
  },
  {
    "id": "gen-otp-5",
    "text": "123456 is your Facebook password reset code#sflx",
    "label": "genuine",
    "note": "Password-reset code that mentions 'password'."
  },
  {
    "id": "gen-otp-6",
    "text": "<#> 08090 is your Facebook code\nLaz+nxCarLW#c2lx#um9h",
    "label": "genuine",
    "note": "Auto-fill style code with a hash string."
  },
  {
    "id": "gen-otp-7",
    "text": "Your WhatsApp code: 356-295 You can also tap on this link to verify your phone: v.whatsapp.com/356-295 Don't share this code with others",
    "label": "genuine",
    "note": "Real code message that also contains a link. Hard for a link rule."
  },
  {
    "id": "gen-otp-8",
    "text": "Use verification code 231102 for Microsoft authentication.",
    "label": "genuine",
    "note": "Plain code."
  },
  {
    "id": "gen-otp-9",
    "text": "[Yalla] You are retrieving your password.5669  is your verification code, DO NOT tell anyone or your account might be stolen.",
    "label": "genuine",
    "note": "Code message with 'password', a shouted warning and 'stolen'. Hard."
  },
  {
    "id": "gen-otp-10",
    "text": "WARNING: EXAMPLE BANK WILL NEVER ASK FOR THIS CODE.\nANY REQUEST FOR IT IS A SCAM.\n109649 is your Online Banking authentication code.\nIf you did not request this, please call us urgently.",
    "label": "genuine",
    "note": "A bank code message that warns about scams and says 'urgently'. Hard for a keyword filter."
  },
  {
    "id": "gen-otp-11",
    "text": "055632 Your password has been successfully changed. If the change is not within your knowledge, please contact EXAMPLE.",
    "label": "genuine",
    "note": "Password-changed notice."
  },
  {
    "id": "gen-otp-12",
    "text": "420781 is OTP for Google Pay UPI registration, valid for 30 seconds. OTPs are SECRET. DO NOT disclose-Example Bank. f6f01vO3FNp",
    "label": "genuine",
    "note": "Bank UPI code with a shouted warning."
  },
  {
    "id": "gen-otp-13",
    "text": "DO NOT SHARE: Your Google Pay OTP is 293000. Message ID: f6f01vO3FNp",
    "label": "genuine",
    "note": "Short code with a warning."
  },
  {
    "id": "gen-otp-14",
    "text": "53757 is your OTP to authenticate redemption at Example Paws, Please share this OTP to proceed further",
    "label": "genuine",
    "note": "A real shop code that says 'share this OTP' to the staff. Very hard: the wording is a classic scam request."
  },
  {
    "id": "gen-otp-15",
    "text": "Dear Parents, Mr/Mrs has come to take your child for half Day Leave Reason, OTP for approve is 956332 Regards EXAMPLE SCHOOL",
    "label": "genuine",
    "note": "School pickup approval code."
  },
  {
    "id": "gen-otp-16",
    "text": "Delete Retailer PANCARD OTP 96211 Regards EXAMPLE TELECOM",
    "label": "genuine",
    "note": "Terse business code that mentions PAN card."
  },
  {
    "id": "gen-otp-17",
    "text": "Dear User, Your Password is 582771",
    "label": "genuine",
    "note": "A password delivered in a message."
  },
  {
    "id": "gen-otp-18",
    "text": "Dear customer, you requested for an OTP to change your mobile Number .The OTP is 29210.Regard EXAMPLE",
    "label": "genuine",
    "note": "Code for changing a mobile number."
  },
  {
    "id": "gen-otp-19",
    "text": "Thank You for boarding, Your deboarding OTP: 68277 -ExampleTravel",
    "label": "genuine",
    "note": "Travel code."
  },
  {
    "id": "gen-otp-20",
    "text": "Use OTP 343643420 to redeem at Example Coffee.",
    "label": "genuine",
    "note": "Redeem code."
  },
  {
    "id": "gen-otp-21",
    "text": "You have used ₹93.50 of your gift card balance. The remaining balance on your gift card is ₹93.50.\nGift card PIN: QD5DDK6RM7G3X\nFor disputes, please reach out to Example support",
    "label": "genuine",
    "note": "A receipt that shows a gift-card PIN and money amounts. Hard."
  },
  {
    "id": "gen-otp-22",
    "text": "Dear Customer,Your RailWire WiFi OTP is 3052",
    "label": "genuine",
    "note": "Wi-Fi code."
  },
  {
    "id": "gen-otp-23",
    "text": "Your OTP for Example login is 05547 This OTP will expire in 5 minutes",
    "label": "genuine",
    "note": "Login code."
  },
  {
    "id": "gen-otp-24",
    "text": "Use OTP 728840 to verify your account.\nOTP is valid for 10 minutes. \n\n-Example",
    "label": "genuine",
    "note": "Verification code from a business sender."
  },
  {
    "id": "gen-otp-25",
    "text": "<#> *** *** is your Instagram code. Don't share it. 62320#z01x",
    "label": "genuine",
    "note": "Code with hidden digits and a warning."
  },
  {
    "id": "gen-otp-26",
    "text": "Your Mi Account verification code is 581235. It expires in 1 day.",
    "label": "genuine",
    "note": "Code with an expiry."
  },
  {
    "id": "gen-otp-27",
    "text": "[Uber] Votre code : 1234. Ne le divulguez jamais.#btit",
    "label": "genuine",
    "note": "French code message ('never disclose it')."
  },
  {
    "id": "gen-otp-28",
    "text": "Hello, Your Example Delivery's mobile verification code is:YUPXiK If you did not request it, please ignore this message.",
    "label": "genuine",
    "note": "Code message with an 'ignore if not you' line."
  },
  {
    "id": "gen-otp-29",
    "text": "यह आपका कोड है कृपया इसे साझा न करें78014",
    "label": "genuine",
    "note": "Hindi 'do not share this code'."
  },
  {
    "id": "gen-otp-30",
    "text": "Dear Customer, Your OTP for Example shoes store verification is 30580. Happy Shopping!",
    "label": "genuine",
    "note": "Store code."
  },
  {
    "id": "gen-otp-31",
    "text": "Your OTP is 490239",
    "label": "genuine",
    "note": "Bare code."
  },
  {
    "id": "gen-otp-32",
    "text": "Dear please enter OTP 811560 to authorize your Order request",
    "label": "genuine",
    "note": "Code message that says 'please enter OTP'."
  },
  {
    "id": "gen-otp-33",
    "text": "Welcome to EXAMPLE HOTEL, OTP for your Stay is 7547535",
    "label": "genuine",
    "note": "Hotel check-in code."
  },
  {
    "id": "gen-otp-34",
    "text": "Your OTP for Registration at Example Gems is 20568 ands is valid for 30 minutes",
    "label": "genuine",
    "note": "Registration code with a typo."
  },
  {
    "id": "gen-otp-35",
    "text": "Example Game MAX मोबाइल रजिस्ट्रेशन के लिए कोड: 149442. यह कोड 10 मिनटतक मान्य रहेगा.",
    "label": "genuine",
    "note": "Hindi registration code."
  },
  {
    "id": "gen-otp-36",
    "text": "01-02 is your OTP for EXAMPLE, Valid for 2minutes",
    "label": "genuine",
    "note": "Code with an odd format."
  },
  {
    "id": "gen-otp-37",
    "text": "Your ExampleApp verification code is 1lRx9U. This OTP is valid for {#var#} minutes. Do not share this OTP with anyone. - ExampleApp",
    "label": "genuine",
    "note": "Code with an unfilled template field and a warning."
  },
  {
    "id": "gen-info-1",
    "text": "12345 Welcome to Example Online Business Account Application! Your case ref. no. is 12345. Thank you for choosing Example Bank (India).",
    "label": "genuine",
    "note": "Plain application acknowledgement."
  },
  {
    "id": "gen-info-2",
    "text": "SPAM CALLS FLAGGED! FRAUD LINKS BLOCKED! BANK OTP FRAUD ALERTS! Check your personalised Example Safe Report on the Example app: https://i.example-telecom.example/safety2",
    "label": "genuine",
    "note": "Telecom company's own promotion that talks about fraud in capital letters. Hard."
  },
  {
    "id": "gen-info-3",
    "text": "ব্যক্তি বা ব্যক্তিগত প্ৰতিষ্ঠানৰ পৰা পোৱা ভুৱা ঋণ ৰেহাইৰ প্ৰস্তাৱৰ পৰা সাৱধান থাকক। কেৱল আপোনাৰ বেংক/NBFC-ৰ সৈতেহে লেনদেন কৰক। সন্দেহজনক প্ৰস্তাৱৰ বিষয়ে sachet.rbi.org.in-ত অভিযোগ দিয়ক।",
    "label": "genuine",
    "note": "Public safety advisory in Assamese about fake loan offers."
  },
  {
    "id": "gen-info-4",
    "text": "We are committed to make your experience beautiful with Example. For any assistance, please contact our team of expert advisors by dialing 198/121 from your Example number. In case if you are not satisfied with the resolution provided by the call centre, you can contact the Appellate authority on the same number.",
    "label": "genuine",
    "note": "Telecom service notice with a helpline number."
  },
  {
    "id": "gen-info-5",
    "text": "22988 تشير التوقعات الواردة من المركز الوطني للأرصاد إلى هطول أمطار بمشيئة الله متوسطة إلى غزيرة والدفاع المدني يهيب بالجميع أخذ الحيطة والحذر والالتزام بتعليماته.",
    "label": "genuine",
    "note": "Public weather warning in Arabic: a language the rule engine does not cover."
  },
  {
    "id": "gen-info-6",
    "text": "You got Netflix from Example! To start watching TV shows and movies, activate: m.netflix.com/AbCdEfGhIjK",
    "label": "genuine",
    "note": "Telecom bundle offer with a link on a real streaming domain."
  },
  {
    "id": "unclear-1",
    "text": "OFS Trade Summary for 1234567890 Amt 7,726,00 Bal 9,781,50 bit.ly/AbC1234 . EXAMPLE SECURITIES PRIVATE LIMITED",
    "label": "unclear",
    "note": "A broker-style summary with a shortened link. Could be a real statement or the same fake-statement family as the scam rows."
  },
  {
    "id": "unclear-2",
    "text": "Finish the current step 021891",
    "label": "unclear",
    "note": "Looks like a verification code with an unusual wording."
  },
  {
    "id": "unclear-3",
    "text": "Complete this stage today 865242",
    "label": "unclear",
    "note": "Same family of odd code messages."
  },
  {
    "id": "unclear-4",
    "text": "Action Step Engaged 781911",
    "label": "unclear",
    "note": "Same family of odd code messages."
  },
  {
    "id": "unclear-5",
    "text": "Your plan expires on OTP 87402 To avoid stoppage of services kindly recharge",
    "label": "unclear",
    "note": "Garbled expiry notice that mixes a code with a recharge request."
  },
  {
    "id": "unclear-6",
    "text": "FOR SALE: DLF Park Place, DLF Phase-5 1983 Sq.Ft. 3BHK + SQ  Price: 6.50 Cr  Call: 9876543210  Jalan Associates 2901",
    "label": "unclear",
    "note": "Unsolicited property promotion: spam, but not a scam."
  },
  {
    "id": "unclear-7",
    "text": "Welcome! In response to your request, we've sent out the notice. Please use 616175 to continue processing.",
    "label": "unclear",
    "note": "Vague message with a code."
  }
];

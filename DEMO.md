# 3-minute Kavach demo

Use two browsers: Chrome profile A and an incognito window as user B.

1. **0:00 — Setup**  
   Open `/setup`. All required flags should be green. Mention: secrets never go to the browser.

2. **0:20 — Sign up**  
   User A: `/signup` with a real email/password and a name. Copy the share code on Family (`XXXX-XXXX`).  
   User B: `/signup` as a second person.

3. **0:50 — Family in real time**  
   A sends B’s code. B’s incoming request appears without refresh. B accepts. Both see the connection.

4. **1:20 — Digital arrest**  
   On Check, A pastes:  
   `This is Inspector Sharma, Cyber Crime. You are under DIGITAL ARREST. Stay on this video call. Share the OTP your bank just sent or we will freeze Aadhaar.`  
   Result: Dangerous, highlighted quotes, English. Toggle Hindi in settings, analyse again.

5. **1:50 — Genuine debit**  
   Paste:  
   `INR 1,250.00 debited from A/c XX4521. Avl Bal INR 8,410. If not you, call the number on your card. Do not share OTP with anyone.`  
   Result: Safe. B’s feed does **not** show it.

6. **2:05 — Family alert**  
   A’s dangerous scan lands on B’s feed in about two seconds, with the slide-in banner. B sees **masked** text only.

7. **2:20 — Sharing off**  
   A turns off “Share my threats” for B. A runs another dangerous paste. B does not see it.

8. **2:35 — Complaint Writer**  
   A: Help → New complaint → chip “lost money” + a UPI story with a real amount and date you type. Plan fields are generated, not a fixed form. Tick a step. Draft documents. Show that invented facts are absent. Print / Save as PDF.

9. **2:55 — Fallback**  
   Mention: if `GEMINI_API_KEY` is removed, Check still returns a basic verdict with the fallback badge.

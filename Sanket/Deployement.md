🚀 HC-FINVEST Deployment Guide

---

🔐 SSH / VPS Credentials
Host (IP):     206.189.142.175
Username:      hcfinvest
Password:      pune@N!lesh$2025
Login command: ssh hcfinvest@206.189.142.175

testing =   hcFinvest.com2026march

---


Branch & Remote Architecture
LOCAL MACHINE (Windows)
└── c:\Users\DELL\Documents\HC-FINVEST - UPDATED - Copy\
    ├── branch: main  ← your working branch
GITHUB REMOTES:
├── origin  → https://github.com/Hc-Finvest/hcfinvest.com   (main company repo)
└── alltick → https://github.com/SanketsMane/HcFinvest-AllTick.git  (teammate's fork)
VPS (Production)
└── hcfinvest@206.189.142.175 → ~/hc-finvest/
    └── pulls from: alltick/main (GitHub)
Step-by-Step: Full Deployment Flow
Step 1 — Make Code Changes Locally
Edit files in c:\Users\DELL\Documents\HC-FINVEST - UPDATED - Copy\ (via VS Code / cursor)

Step 2 — Commit Changes Locally
powershell
cd "c:\Users\DELL\Documents\HC-FINVEST - UPDATED - Copy"
git add .
git commit -m "feat: describe your change here v7.XX"
Step 3 — Push to origin (Company GitHub)
powershell
git push origin main
This pushes to https://github.com/Hc-Finvest/hcfinvest.com

Step 4 — Push to alltick (Teammate's Fork — VPS source)
powershell
git push alltick main
This pushes to https://github.com/SanketsMane/HcFinvest-AllTick.git
⚠️ The VPS pulls from alltick/main — so this step is mandatory for production.

Step 5 — Deploy on VPS (Build + Restart)
SSH into the server and run:

bash
ssh hcfinvest@206.189.142.175
# Password: pune@N!lesh$2025
Then on the VPS:

bash
cd ~/hc-finvest
git pull alltick main          # pull latest from GitHub
cd frontend
npm run build                  # build React app
cd ..
pm2 restart all                # restart backend + serve new frontend
Or as a one-liner from Windows:

powershell
ssh hcfinvest@206.189.142.175 "cd ~/hc-finvest ; git pull alltick main ; cd frontend ; npm run build ; pm2 restart all"
Branch Strategy
Branch	Purpose
main (local)	Active development branch
origin/main	Company master backup on GitHub
alltick/main	VPS source of truth — what production deploys from
alltick/v7.X-deploy	Tagged deploy snapshots (e.g. v7.43-deploy, v7.44-deploy, v7.45-deploy)
origin/testing	Staging/testing branch (company repo)
Latest Commit History (What's on main)
2717c12e → v7.55: Chart Persistence & Symbol Sync Fix  ← CURRENT
7ae0d45b → balance text black
128d93cc → v7.50: Production Ready Patch
e97e79aa → v7.45: ultra-low latency 50ms
2e5871b3 → v7.44: 200ms data stream
87bf2eb4 → v7.43: stability fixes
Quick Reference Cheat Sheet
powershell
# 1. Commit
git add . ; git commit -m "fix: my change v7.XX"
# 2. Push both remotes
git push origin main
git push alltick main
# 3. Deploy to VPS
ssh hcfinvest@206.189.142.175 "cd ~/hc-finvest ; git pull alltick main ; cd frontend ; npm run build ; pm2 restart all"
# 4. Monitor logs on VPS
ssh hcfinvest@206.189.142.175 "pm2 logs --lines 50"
Common Issues & Fixes
Problem	Fix
VPS doesn't see new code	Make sure Step 4 (git push alltick main) was done
pm2 restart gives errors	Run pm2 logs to see which service crashed
Build fails on VPS	Run npm install in /frontend before npm run build
SSH password prompt hangs	Use -tt flag: ssh -tt hcfinvest@...
Permission denied on .git	Run sudo chmod -R 775 ~/hc-finvest/.git on VPS
Note: The two SSH commands currently running in your terminal are waiting for the password to be entered interactively. You'll need to approve and type the password manually since it can't be passed non-interactively over SSH in PowerShell.
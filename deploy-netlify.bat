@echo off
echo Deploying AI Support Assistant to Netlify...
echo.
echo 1. Build completed successfully
echo 2. Opening Netlify dashboard for manual deployment...
echo.
echo Instructions:
echo - Go to https://app.netlify.com/drop
echo - Drag the 'frontend\build' folder into the deployment area
echo - Your site will be live at: https://your-site-name.netlify.app
echo.
echo 3. Alternative: Connect GitHub to Netlify for auto-deployment
echo    - Repository: https://github.com/harish-2807/chatbox.git
echo    - Branch: gh-pages
echo.
pause
start https://app.netlify.com/drop

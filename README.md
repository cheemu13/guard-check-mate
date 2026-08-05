# Guard Inspection 

Build a mobile-first application called "ICICI Security Uniform Inspection".

Purpose:

This application helps supervisors inspect ICICI Bank security guards by comparing a guard's photo against an ideal uniform reference image using OpenAI Vision AI.

The app should have the following screens:

1. Login Screen

- Username

- Password

- ICICI branding

- Login button

2. Home Screen

- Start New Inspection

- Inspection History

- Settings

3. New Inspection Screen

Capture or upload:

- Branch Name

- Guard Name

- Guard ID

- Date & Time (auto)

- Guard Photo using camera

- Display the Ideal Uniform Reference Image for comparison

4. AI Inspection

When the user taps "Inspect Uniform":

- Send the Guard Photo and the Ideal Uniform Reference Image to OpenAI Vision.

- Use the provided inspection prompt.

- Wait for the AI response.

5. Results Screen

Display:

Overall Status

(Pass / Needs Attention / Fail)

Checklist:

- Cap

- Cap Badge

- Shirt

- Collar

- Shoulder Epaulettes

- Chest Badge

- Name Badge

- ID Card

- Belt

- Trousers

- Shoes

- Grooming

- Uniform Cleanliness

- Shirt Tucked In

Each item should show:

✅ Correct

❌ Missing

⚠ Incorrectly Worn

⚠ Damaged

👁 Not Visible

Also show:

Critical Issues

Summary

Inspection Score (0–100%)

6. Submit Inspection

Save the inspection locally.

Allow export as PDF.

Allow supervisor comments.

Design:

Use ICICI Bank brand colours:

Orange

White

Dark Grey

Use large buttons for easy mobile use.

The application should be responsive and suitable for Android phones.

Prepare the application so it can connect to OpenAI Vision API later.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://guard-check-mate.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6dee6155-53fc-4163-99fe-0b1b96c2accd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

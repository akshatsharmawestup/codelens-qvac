# CodeLens — Local AI Code Explainer

A developer tool that explains source code with Tether's QVAC SDK. The model runs locally on the user's machine.

## QVAC
- `@qvac/sdk` **0.19.1**
- `loadModel()`
- `completion()`
- Model: `LLAMA_3_2_1B_INST_Q4_0`

## Features
- C, C++, Python, Java, JavaScript, HTML/CSS and SQL
- Beginner-friendly overview
- Step-by-step explanation
- Time and space complexity
- Improvement suggestions
- No cloud AI API key

## Run
Requires Node.js 18+.

```bash
npm install
npm start
```

Open `http://localhost:3000`.

The first run may take longer because QVAC loads/downloads the local model. No application code sends the submitted source code to an external AI API.

## Structure
```text
codelens-qvac/
├── public/
│   ├── index.html
│   ├── app.js
│   └── style.css
├── server.js
├── package.json
├── README.md
├── LICENSE
└── .gitignore
```

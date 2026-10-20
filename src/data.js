/* Wheel topics and questions (carried over from the original game). */
export const CATEGORIES = [
  {
    name: "Password", short: "Password", icon: "🔐", prize: "Ballpen",
    questions: [
      { type: "mc", q: "What makes a password strong?",
        options: [
          { key: "A", text: "Your pet's name" },
          { key: "B", text: "A mix of letters, numbers, symbols, and length" },
          { key: "C", text: "\"password123\"" },
          { key: "D", text: "Your birthday" },
        ], correct: "B" },
      { type: "tf", q: "True or False: Using the same password for every account is safe if it's long.",
        correct: "False", explain: "Reuse means one breach exposes everything." },
    ],
  },
  {
    name: "Irish Trivia", short: "Irish Trivia", icon: "☘️", prize: "Notebook",
    questions: [
      { type: "mc", q: "Which of these tech giants does NOT have its European HQ in Ireland?",
        options: [
          { key: "A", text: "Google" }, { key: "B", text: "Meta" },
          { key: "C", text: "Amazon" }, { key: "D", text: "Spotify" },
        ], correct: "D",
        explain: "Spotify's EU HQ is Stockholm, Sweden; Google, Meta and Amazon are Dublin-based." },
      { type: "mc", q: "What is the Irish word for \"cybersecurity\"?",
        options: [
          { key: "A", text: "Cibearshlándáil" }, { key: "B", text: "Ríomhshábháilteacht" },
          { key: "C", text: "Teicslándáil" }, { key: "D", text: "Cibearchosaint" },
        ], correct: "A" },
    ],
  },
  {
    name: "Social Engineering", short: "Soc. Eng.", icon: "🎭", prize: "Notebook",
    questions: [
      { type: "mc", q: "What is \"social engineering\" in cybersecurity?",
        options: [
          { key: "A", text: "Building social media apps" },
          { key: "B", text: "Manipulating people into giving up confidential info" },
          { key: "C", text: "Networking events" },
          { key: "D", text: "Team building" },
        ], correct: "B" },
      { type: "tf", q: "True or False: A caller claiming to be \"IT support\" asking for your password is a common scam tactic.",
        correct: "True" },
    ],
  },
  {
    name: "AI", short: "AI", icon: "🤖", prize: "Ballpen",
    questions: [
      { type: "mc", q: "What does \"AI\" stand for?",
        options: [
          { key: "A", text: "Artificial Intelligence" }, { key: "B", text: "Automated Interface" },
          { key: "C", text: "Advanced Internet" }, { key: "D", text: "Applied Informatics" },
        ], correct: "A" },
      { type: "tf", q: "True or False: AI models can sometimes produce incorrect or made-up information, known as \"hallucination.\"",
        correct: "True" },
    ],
  },
  {
    name: "Malware", short: "Malware", icon: "🦠", prize: "Notebook",
    questions: [
      { type: "mc", q: "What is ransomware?",
        options: [
          { key: "A", text: "Software that locks your files until you pay" },
          { key: "B", text: "A free antivirus tool" },
          { key: "C", text: "A type of Wi-Fi" },
          { key: "D", text: "A backup tool" },
        ], correct: "A" },
      { type: "mc", q: "How does malware often spread?",
        options: [
          { key: "A", text: "Infected email attachments" }, { key: "B", text: "Fake software downloads" },
          { key: "C", text: "Malicious USB drives" }, { key: "D", text: "All of the above" },
        ], correct: "D" },
    ],
  },
  { name: "Jackpot", short: "JACKPOT", icon: "⭐", jackpot: true },
];

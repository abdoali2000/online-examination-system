// ============================================================
//  questions.js — Default question bank
//  Stored in localStorage under key "adminQuestions" once loaded.
//  Admin can add / edit / delete via admin.html dashboard.
// ============================================================

export const defaultQuestions = [

  // =====================================================================
  //  MEDICAL — TRUE / FALSE  (31 questions)
  // =====================================================================
  {
    id: 1, examType: "medical", type: "tf",
    text: "Orogeng Mouthwash contains menthol, chlorhexidine and Sodium.",
    correct: false
  },
  {
    id: 2, examType: "medical", type: "tf",
    text: "Hyaluronic Acid in Orogeng Mouthwash helps support oral tissue hydration and soothing.",
    correct: false
  },
  {
    id: 3, examType: "medical", type: "tf",
    text: "Orogeng-H Mouthwash is primarily designed as a teeth-whitening product.",
    correct: false
  },
  {
    id: 4, examType: "medical", type: "tf",
    text: "Doveyderm can be used in cases of chickenpox, sunburns, and insect bites.",
    correct: true
  },
  {
    id: 5, examType: "medical", type: "tf",
    text: "The primary use of Jovey Joy is moisturizing newborn skin.",
    correct: false
  },
  {
    id: 6, examType: "medical", type: "tf",
    text: "Jovey Joy contains Ethyl Alcohol 70% as its main active ingredient.",
    correct: true
  },
  {
    id: 7, examType: "medical", type: "tf",
    text: "Chlorhexidine in Doveyderm Lotion helps prevent secondary bacterial infection.",
    correct: true
  },
  {
    id: 8, examType: "medical", type: "tf",
    text: "Menthol in Doveyderm provides a cooling and soothing sensation that helps relieve heat rash symptoms.",
    correct: true
  },
  {
    id: 9, examType: "medical", type: "tf",
    text: "Orogeng mouthwash contains Propolis Extract and Calcium Phosphate.",
    correct: true
  },
  {
    id: 10, examType: "medical", type: "tf",
    text: "Calamine helps manage heat rash mainly by reducing skin irritation and itching.",
    correct: true
  },
  {
    id: 11, examType: "medical", type: "tf",
    text: "Sweet Almond Oil helps nourish and soften the skin due to its fatty acid content.",
    correct: true
  },
  {
    id: 12, examType: "medical", type: "tf",
    text: "Calamine is suitable for pediatric use because it is gentle on sensitive infant skin.",
    correct: true
  },
  {
    id: 13, examType: "medical", type: "tf",
    text: "Doveyderm Lotion is available in a 100 ml bottle and is priced at 59 EGP.",
    correct: false
  },
  {
    id: 14, examType: "medical", type: "tf",
    text: "Oroking-C cannot be used from one day of age.",
    correct: false
  },
  {
    id: 15, examType: "medical", type: "tf",
    text: "Ticanase and Nasonex are considered competitors of Nova Dova Spray.",
    correct: false
  },
  {
    id: 16, examType: "medical", type: "tf",
    text: "Orogeng-H contains Chlorhexidine at a concentration of 0.25%.",
    correct: true
  },
  {
    id: 17, examType: "medical", type: "tf",
    text: "Alcohol is used in umbilical cord care mainly to reduce bacterial growth and help prevent infection.",
    correct: true
  },
  {
    id: 18, examType: "medical", type: "tf",
    text: "Oroking-C spray is available in a 60 ml bottle and costs 65 EGP.",
    correct: false
  },
  {
    id: 19, examType: "medical", type: "tf",
    text: "Glycerin in Quote Fine Cream acts as a humectant that attracts and retains moisture.",
    correct: true
  },
  {
    id: 20, examType: "medical", type: "tf",
    text: "Allantoin is mainly responsible for the antiseptic action of Quote Fine Cream.",
    correct: false
  },
  {
    id: 21, examType: "medical", type: "tf",
    text: "Panthenol supports skin hydration and regeneration.",
    correct: true
  },
  {
    id: 22, examType: "medical", type: "tf",
    text: "The combination of Zinc Oxide, Allantoin, and Panthenol makes Quote Fine Cream suitable for irritated and sensitive skin.",
    correct: true
  },
  {
    id: 23, examType: "medical", type: "tf",
    text: "Nova Dova nasal spray is available in a 100 ml bottle priced at 108 EGP.",
    correct: false
  },
  {
    id: 24, examType: "medical", type: "tf",
    text: "Chlorhexidine is considered the main active ingredient in Orogeng.",
    correct: true
  },
  {
    id: 25, examType: "medical", type: "tf",
    text: "Oroking-C oral spray contains Hyaluronic Acid.",
    correct: true
  },
  {
    id: 26, examType: "medical", type: "tf",
    text: "Orogeng mouthwash is available in a 150 ml bottle and costs 55 EGP.",
    correct: true
  },
  {
    id: 27, examType: "medical", type: "tf",
    text: "Propolis in Oroking-C acts as an antifungal against Candida albicans.",
    correct: true
  },
  {
    id: 28, examType: "medical", type: "tf",
    text: "Oroking-C contains Propolis that reduces inflammation and accelerates ulcer healing.",
    correct: false
  },
  {
    id: 29, examType: "medical", type: "tf",
    text: "Doveyderm Lotion contains Vitamin E as one of its ingredients.",
    correct: false
  },
  {
    id: 30, examType: "medical", type: "tf",
    text: "Orogeng-H contains Hyaluronic Acid at a concentration of 0.4%.",
    correct: true
  },
  {
    id: 31, examType: "medical", type: "tf",
    text: "Nova Dova nasal spray helps relieve nasal congestion by naturally reducing nasal swelling and congestion.",
    correct: true
  },

  // =====================================================================
  //  MEDICAL — MCQ  (25 questions)
  // =====================================================================
  {
    id: 32, examType: "medical", type: "mcq",
    text: "How should the Nova Dova nasal spray be directed during use?",
    options: [
      "Toward the nasal septum",
      "Slightly outward toward the lateral nasal wall",
      "Straight upward",
      "Toward the throat"
    ],
    correctIndex: 1
  },
  {
    id: 33, examType: "medical", type: "mcq",
    text: "What is the concentration of Sodium Fluoride in Orogeng-H?",
    options: ["0.5%", "0.05%", "0.1%", "1%"],
    correctIndex: 1
  },
  {
    id: 34, examType: "medical", type: "mcq",
    text: "Nova Dova is a saline nasal spray used to relieve nasal congestion. What is the main ingredient in the spray?",
    options: ["Sea water", "Chlorhexidine", "Menthol", "All of the above"],
    correctIndex: 0
  },
  {
    id: 35, examType: "medical", type: "mcq",
    text: "What is the main benefit of Jovey Joy for newborns?",
    options: [
      "B and C both",
      "Preventing umbilical cord infection",
      "Treating diaper rash",
      "Relieving teething pain"
    ],
    correctIndex: 1
  },
  {
    id: 36, examType: "medical", type: "mcq",
    text: "What is the role of Zinc Oxide in Quote Fine Cream?",
    options: [
      "Acts as a chemical exfoliant",
      "Forms a natural protective layer that helps reduce irritation caused by friction or moisture",
      "Acts as an antifungal agent",
      "All of the above"
    ],
    correctIndex: 1
  },
  {
    id: 37, examType: "medical", type: "mcq",
    text: "From what age is Orogeng mouthwash suitable for daily use?",
    options: ["From birth", "From 2 years old", "From 6 years old", "From 12 years old"],
    correctIndex: 2
  },
  {
    id: 38, examType: "medical", type: "mcq",
    text: "Which of the following is true regarding Norhinose spray and Nova Dova spray?",
    options: [
      "Norhinose is a direct competitor to Nova Dova",
      "Norhinose is not considered a competitor to Nova Dova",
      "They have the same composition",
      "Norhinose contains Sodium Fluoride"
    ],
    correctIndex: 1
  },
  {
    id: 39, examType: "medical", type: "mcq",
    text: "Which of the following is NOT found in Oroking-C?",
    options: ["Hyaluronic Acid", "Propolis", "Menthol", "Itraconazole"],
    correctIndex: 3
  },
  {
    id: 40, examType: "medical", type: "mcq",
    text: "What is the role of Chlorhexidine in Orogeng-H?",
    options: [
      "At a therapeutic concentration",
      "At a preventive concentration",
      "At an antiviral concentration",
      "At an analgesic concentration"
    ],
    correctIndex: 1
  },
  {
    id: 41, examType: "medical", type: "mcq",
    text: "What are the correct price and size of Orogeng-H?",
    options: ["79 EGP / 150 ml", "99 EGP / 125 ml", "59 EGP / 150 ml", "79 EGP / 125 ml"],
    correctIndex: 1
  },
  {
    id: 42, examType: "medical", type: "mcq",
    text: "Which statement correctly describes the appearance of Orogeng-H and Orogeng?",
    options: [
      "Orogeng-H is colored, while Orogeng is transparent.",
      "Orogeng-H is transparent, while Orogeng is colored.",
      "Both are colored.",
      "Both are transparent."
    ],
    correctIndex: 1
  },
  {
    id: 43, examType: "medical", type: "mcq",
    text: "Excessive alcohol use may lead to:",
    options: [
      "Skin irritation",
      "Increased skin hydration",
      "Both A and D",
      "Increased collagen production"
    ],
    correctIndex: 0
  },
  {
    id: 44, examType: "medical", type: "mcq",
    text: "Jovey Joy should NOT be used on:",
    options: [
      "The navel area",
      "Small superficial wounds",
      "Large open wounds",
      "The umbilical cord of newborns"
    ],
    correctIndex: 2
  },
  {
    id: 45, examType: "medical", type: "mcq",
    text: "Doveyderm Lotion may be useful in treating:",
    options: [
      "Severe fungal infection",
      "Heat rash with mild bacterial contamination",
      "Viral skin infection",
      "Severe allergic reactions"
    ],
    correctIndex: 1
  },
  {
    id: 46, examType: "medical", type: "mcq",
    text: "What is the main role of menthol in diaper rash treatment?",
    options: [
      "Strong antibacterial activity",
      "Cooling and soothing effect",
      "Antifungal activity",
      "Skin lightening"
    ],
    correctIndex: 1
  },
  {
    id: 47, examType: "medical", type: "mcq",
    text: "How does glycerin help speed up skin recovery?",
    options: [
      "By removing skin oils",
      "By maintaining adequate skin hydration",
      "By increasing skin peeling",
      "By causing skin irritation"
    ],
    correctIndex: 1
  },
  {
    id: 48, examType: "medical", type: "mcq",
    text: "Which of the following ingredients is present in Orogeng-H?",
    options: [
      "Cinnamon extract and propolis",
      "Itraconazole and ketoconazole",
      "Zinc oxide and shea butter",
      "Eucalyptus oil and vitamin E"
    ],
    correctIndex: 0
  },
  {
    id: 49, examType: "medical", type: "mcq",
    text: "Oroking-C is marketed in which of the following medical specialties?",
    options: [
      "Dentistry only",
      "Pediatrics and dentistry only",
      "Dentistry, pediatrics, gastroenterology, and dermatology",
      "Dermatology only"
    ],
    correctIndex: 2
  },
  {
    id: 50, examType: "medical", type: "mcq",
    text: "What is the role of chlorhexidine in inflamed or cracked skin?",
    options: [
      "It has no role in preventing infection.",
      "It may help prevent infection.",
      "It increases bacterial growth.",
      "It causes skin dryness."
    ],
    correctIndex: 1
  },
  {
    id: 51, examType: "medical", type: "mcq",
    text: "How does zinc oxide help protect irritated skin?",
    options: [
      "By increasing friction",
      "By reducing friction and preventing further exposure to irritants",
      "By removing the skin's protective barrier",
      "By increasing moisture loss"
    ],
    correctIndex: 1
  },
  {
    id: 52, examType: "medical", type: "mcq",
    text: "What is the main benefit of sodium fluoride in Orogeng?",
    options: [
      "Reducing the incidence of new dental caries",
      "Treating gum infections",
      "Relieving tooth pain",
      "Treating fungal mouth infections"
    ],
    correctIndex: 0
  },
  {
    id: 53, examType: "medical", type: "mcq",
    text: "Which statement about shea butter is correct?",
    options: [
      "It is not suitable for dry and damaged skin.",
      "It is suitable for dry and damaged skin.",
      "It causes severe skin irritation.",
      "All of the above"
    ],
    correctIndex: 1
  },
  {
    id: 54, examType: "medical", type: "mcq",
    text: "Why are the ingredients of Quote Fine Cream suitable for frequent daily use?",
    options: [
      "Because they are highly irritating.",
      "Because they help moisturize and protect the skin.",
      "Because they cause skin peeling.",
      "All of the above"
    ],
    correctIndex: 1
  },
  {
    id: 55, examType: "medical", type: "mcq",
    text: "Oroking-C can be used in:",
    options: [
      "Teething in newborns",
      "Both A and D",
      "Umbilical cord infections",
      "Heat rash"
    ],
    correctIndex: 0
  },
  {
    id: 56, examType: "medical", type: "mcq",
    text: "Quote Fine Cream can help relieve:",
    options: [
      "Nipple irritation in breastfeeding mothers",
      "Severe bacterial infections",
      "Nasal congestion",
      "All of the above"
    ],
    correctIndex: 0
  },

  // =====================================================================
  //  SOFT SKILLS — TRUE / FALSE  (10 placeholder questions)
  //  Replace with real questions when ready.
  // =====================================================================
  {
    id: 57, examType: "softskills", type: "tf",
    text: "Building rapport with healthcare professionals is an essential skill for medical representatives.",
    correct: true
  },
  {
    id: 58, examType: "softskills", type: "tf",
    text: "Active listening means only hearing words without paying attention to body language.",
    correct: false
  },
  {
    id: 59, examType: "softskills", type: "tf",
    text: "Effective communication in medical sales requires adapting your message to the audience.",
    correct: true
  },
  {
    id: 60, examType: "softskills", type: "tf",
    text: "A medical representative should never ask about a doctor's concerns or objections.",
    correct: false
  },
  {
    id: 61, examType: "softskills", type: "tf",
    text: "Time management is not important for medical representatives because they work independently.",
    correct: false
  },
  {
    id: 62, examType: "softskills", type: "tf",
    text: "Empathy helps medical representatives better understand the needs of healthcare professionals.",
    correct: true
  },
  {
    id: 63, examType: "softskills", type: "tf",
    text: "Follow-up after a sales visit is considered unnecessary in professional medical sales.",
    correct: false
  },
  {
    id: 64, examType: "softskills", type: "tf",
    text: "Professionalism includes punctuality, proper dress, and respectful communication.",
    correct: true
  },
  {
    id: 65, examType: "softskills", type: "tf",
    text: "Constructive feedback from supervisors should always be ignored by medical representatives.",
    correct: false
  },
  {
    id: 66, examType: "softskills", type: "tf",
    text: "Goal setting helps medical representatives track their progress and stay motivated.",
    correct: true
  },

  // =====================================================================
  //  SOFT SKILLS — MCQ  (5 placeholder questions)
  // =====================================================================
  {
    id: 67, examType: "softskills", type: "mcq",
    text: "What is the most effective approach when facing objections from a doctor?",
    options: [
      "Ignore the objection and continue your presentation",
      "Listen carefully and address the concern with relevant product information",
      "Immediately offer discounts",
      "End the visit and try again later"
    ],
    correctIndex: 1
  },
  {
    id: 68, examType: "softskills", type: "mcq",
    text: "Which of the following is a key element of professional communication?",
    options: [
      "Using complex medical jargon to impress the audience",
      "Listening actively and responding clearly and respectfully",
      "Avoiding eye contact to appear professional",
      "Speaking as fast as possible to cover more topics"
    ],
    correctIndex: 1
  },
  {
    id: 69, examType: "softskills", type: "mcq",
    text: "What does 'body language' refer to in professional communication?",
    options: [
      "The words you choose to say",
      "The tone of your voice only",
      "Non-verbal signals like gestures, posture, and facial expressions",
      "The speed of your speech"
    ],
    correctIndex: 2
  },
  {
    id: 70, examType: "softskills", type: "mcq",
    text: "How should a medical representative handle a dissatisfied client?",
    options: [
      "Blame the company's product quality",
      "Avoid the client until they calm down",
      "Listen empathetically, acknowledge the issue, and offer a solution",
      "Escalate the issue immediately without listening"
    ],
    correctIndex: 2
  },
  {
    id: 71, examType: "softskills", type: "mcq",
    text: "Which of the following best describes teamwork in a professional setting?",
    options: [
      "Each person works independently without communication",
      "Sharing responsibilities, communicating openly, and supporting colleagues toward a common goal",
      "Competing with teammates to achieve personal targets",
      "Delegating all work to others"
    ],
    correctIndex: 1
  }
];

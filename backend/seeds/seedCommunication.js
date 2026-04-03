const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const CommunicationQuestion = require('../models/CommunicationQuestion');

const questions = [
  // ===== SCENARIO (10) =====
  { orderIndex: 1, type: 'scenario', speakingTimeSeconds: 30,
    prompt: `You are a team lead and one of your teammates has been missing deadlines for two weeks without explanation. Your manager has noticed and asked you to handle it professionally.\n\nSpeak about: How would you approach this conversation? What steps would you take to resolve it while maintaining team harmony?`,
    evaluationCriteria: 'Evaluate empathy, structured problem-solving, professional communication, conflict resolution maturity' },
  { orderIndex: 2, type: 'scenario', speakingTimeSeconds: 30,
    prompt: `You are presenting a project proposal to a client. Midway through, the client interrupts and says they are unhappy with the direction and want major changes.\n\nSpeak about: How would you handle this situation? How would you address the client's concerns while protecting your team's work?`,
    evaluationCriteria: 'Evaluate client handling, composure under pressure, negotiation skills, professional adaptability' },
  { orderIndex: 3, type: 'scenario', speakingTimeSeconds: 30,
    prompt: `You discover a critical bug in your code just one hour before a scheduled product release. Your manager is unavailable.\n\nSpeak about: What immediate steps would you take? How would you communicate this to stakeholders?`,
    evaluationCriteria: 'Evaluate crisis management, decision-making under pressure, communication clarity, responsibility' },
  { orderIndex: 4, type: 'scenario', speakingTimeSeconds: 30,
    prompt: `During a team meeting, two of your colleagues get into a heated argument about the technical approach for a project. You are the most senior developer in the room.\n\nSpeak about: How would you mediate this conflict? What approach would you use to reach a consensus?`,
    evaluationCriteria: 'Evaluate leadership, mediation skills, emotional intelligence, ability to synthesize viewpoints' },
  { orderIndex: 5, type: 'scenario', speakingTimeSeconds: 30,
    prompt: `You have been assigned to work on a project using a technology you have no experience with. The deadline is in two weeks.\n\nSpeak about: How would you approach learning the new technology? What strategy would you follow to deliver on time?`,
    evaluationCriteria: 'Evaluate learning agility, planning ability, self-awareness, resourcefulness' },
  { orderIndex: 6, type: 'scenario', speakingTimeSeconds: 30,
    prompt: `Your company is going through layoffs and your team's morale is very low. As a team lead, people are looking to you for reassurance.\n\nSpeak about: How would you address the team? What would you say to maintain productivity and morale?`,
    evaluationCriteria: 'Evaluate emotional leadership, empathy, communication tone, motivational ability' },
  { orderIndex: 7, type: 'scenario', speakingTimeSeconds: 30,
    prompt: `A junior colleague asks you to review their code. You find multiple fundamental issues that would take significant time to fix.\n\nSpeak about: How would you give feedback constructively? How would you balance honesty with encouragement?`,
    evaluationCriteria: 'Evaluate mentoring ability, constructive feedback skills, patience, teaching clarity' },
  { orderIndex: 8, type: 'scenario', speakingTimeSeconds: 30,
    prompt: `You are working remotely and a teammate in a different timezone is consistently not responding to messages, causing project delays.\n\nSpeak about: How would you address this situation? What communication strategies would you implement?`,
    evaluationCriteria: 'Evaluate remote collaboration skills, proactive communication, problem resolution, cultural sensitivity' },
  { orderIndex: 9, type: 'scenario', speakingTimeSeconds: 30,
    prompt: `Your manager assigns you a task that you believe is ethically questionable — like manipulating user data to inflate metrics.\n\nSpeak about: How would you handle this situation? What would you say to your manager?`,
    evaluationCriteria: 'Evaluate ethical reasoning, professional courage, diplomatic communication, integrity' },
  { orderIndex: 10, type: 'scenario', speakingTimeSeconds: 30,
    prompt: `You are interviewing for your dream company and the interviewer asks: "Tell me about a time you failed and what you did about it."\n\nSpeak about: Give a genuine answer as if you were in this interview right now.`,
    evaluationCriteria: 'Evaluate authenticity, self-awareness, growth mindset, storytelling ability, interview presence' },

  // ===== READING COMPREHENSION (10) =====
  { orderIndex: 11, type: 'read_comprehension', speakingTimeSeconds: 30,
    prompt: `Read the following passage and respond:\n\n"Artificial intelligence is transforming the job market at an unprecedented pace. While many fear widespread unemployment, economists suggest AI will create more jobs than it eliminates — but these jobs will require entirely different skills. The critical question is not whether AI will replace humans, but how quickly workers can adapt and reskill."\n\nSpeak about:\n1. What is the main argument?\n2. Do you agree or disagree, and why?\n3. How does this affect you as a student entering the workforce?`,
    evaluationCriteria: 'Evaluate reading comprehension, opinion formation, vocabulary richness, argument structure' },
  { orderIndex: 12, type: 'read_comprehension', speakingTimeSeconds: 30,
    prompt: `Read the following passage and respond:\n\n"Remote work, once considered a temporary solution, has become a permanent fixture in many organizations. Studies show that while productivity often increases, employee well-being suffers without proper boundaries. The challenge for modern managers is creating a culture of trust and accountability that works across screens."\n\nSpeak about:\n1. What challenge does the passage describe?\n2. What solutions would you propose?\n3. Share your personal experience with remote work or study.`,
    evaluationCriteria: 'Evaluate comprehension accuracy, solution creativity, personal reflection quality, fluency' },
  { orderIndex: 13, type: 'read_comprehension', speakingTimeSeconds: 30,
    prompt: `Read the following passage and respond:\n\n"The startup ecosystem in India has grown exponentially, with over 100 unicorns as of 2024. However, critics argue that this growth is fueled by unsustainable venture capital rather than genuine innovation. Many startups prioritize growth over profitability, leading to a cycle of boom and bust."\n\nSpeak about:\n1. Summarize the passage in your own words.\n2. Do you think growth or profitability should come first for startups?\n3. Would you prefer working at a startup or an established company?`,
    evaluationCriteria: 'Evaluate summarization skills, analytical thinking, personal opinion clarity, business awareness' },
  { orderIndex: 14, type: 'read_comprehension', speakingTimeSeconds: 30,
    prompt: `Read the following passage and respond:\n\n"Climate change is not just an environmental issue — it is an economic, social, and political challenge. Rising temperatures affect agriculture, increase natural disasters, and displace millions. Technology alone cannot solve this; it requires coordinated global action and individual behavioral change."\n\nSpeak about:\n1. What does the author mean by 'coordinated global action'?\n2. What role can technology play despite its limitations?\n3. What changes have you personally made in response to climate concerns?`,
    evaluationCriteria: 'Evaluate critical analysis, topic awareness, personal accountability, structured response' },
  { orderIndex: 15, type: 'read_comprehension', speakingTimeSeconds: 30,
    prompt: `Read the following passage and respond:\n\n"Social media has democratized information but also created echo chambers. People increasingly consume content that confirms their existing beliefs, reducing exposure to diverse perspectives. Research suggests this polarization is weakening democratic discourse."\n\nSpeak about:\n1. What are 'echo chambers' according to the passage?\n2. How do you personally ensure you get diverse perspectives?\n3. Should social media platforms be responsible for reducing polarization?`,
    evaluationCriteria: 'Evaluate media literacy, critical thinking, personal reflection, debate quality' },
  { orderIndex: 16, type: 'read_comprehension', speakingTimeSeconds: 30,
    prompt: `Read the following passage and respond:\n\n"The gig economy offers flexibility but lacks security. Millions of workers worldwide operate without health insurance, retirement benefits, or job stability. While platforms like Uber and Freelancer have created new opportunities, they have also shifted risk from employers to workers."\n\nSpeak about:\n1. What trade-off does the passage describe?\n2. Should gig workers receive the same benefits as full-time employees?\n3. Would you consider freelancing after graduation?`,
    evaluationCriteria: 'Evaluate understanding of economic concepts, balanced argumentation, personal career reflection' },
  { orderIndex: 17, type: 'read_comprehension', speakingTimeSeconds: 30,
    prompt: `Read the following passage and respond:\n\n"Education systems worldwide were built for the industrial age but are struggling to prepare students for the digital era. Memorization-based learning is being replaced by skill-based approaches emphasizing critical thinking, creativity, and collaboration. Yet most institutions resist change."\n\nSpeak about:\n1. What is the core problem identified in the passage?\n2. How has your own education prepared or failed to prepare you for the modern workplace?\n3. What changes would you suggest?`,
    evaluationCriteria: 'Evaluate educational awareness, self-reflection, constructive suggestions, communication clarity' },
  { orderIndex: 18, type: 'read_comprehension', speakingTimeSeconds: 30,
    prompt: `Read the following passage and respond:\n\n"Mental health awareness has increased significantly, but access to mental health services remains limited, especially in developing countries. The stigma around seeking help persists, particularly in professional environments where showing vulnerability is seen as weakness."\n\nSpeak about:\n1. Why does stigma persist despite increased awareness?\n2. What can companies do to support employee mental health?\n3. How do you personally manage stress?`,
    evaluationCriteria: 'Evaluate emotional intelligence, empathy, practical suggestions, openness' },
  { orderIndex: 19, type: 'read_comprehension', speakingTimeSeconds: 30,
    prompt: `Read the following passage and respond:\n\n"Data privacy has become one of the most important issues of our time. Companies collect vast amounts of personal data, often without meaningful consent. Regulations like GDPR are a start, but enforcement remains inconsistent across borders."\n\nSpeak about:\n1. What is the main concern raised?\n2. Do you read privacy policies before agreeing to them? Why or why not?\n3. Should governments have more control over tech companies' data practices?`,
    evaluationCriteria: 'Evaluate tech awareness, honesty, argumentation skill, regulatory understanding' },
  { orderIndex: 20, type: 'read_comprehension', speakingTimeSeconds: 30,
    prompt: `Read the following passage and respond:\n\n"Diversity in the workplace is not just a moral imperative — it is a business advantage. Research consistently shows that diverse teams make better decisions, innovate faster, and achieve higher returns. Yet underrepresentation of women and minorities in leadership persists globally."\n\nSpeak about:\n1. What connection does the passage draw between diversity and business?\n2. Why does underrepresentation persist despite evidence?\n3. What role can you play in promoting diversity?`,
    evaluationCriteria: 'Evaluate social awareness, analytical depth, personal commitment, inclusivity' },

  // ===== PERSONAL (10) =====
  { orderIndex: 21, type: 'personal', speakingTimeSeconds: 30,
    prompt: `Tell us about a significant failure or setback you have faced — in academics, a project, or any personal goal.\n\nSpeak about:\n1. What exactly happened?\n2. What did you learn from it?\n3. How has it changed the way you approach challenges today?`,
    evaluationCriteria: 'Evaluate self-awareness, growth mindset, storytelling coherence, emotional maturity, fluency' },
  { orderIndex: 22, type: 'personal', speakingTimeSeconds: 30,
    prompt: `Describe your biggest achievement so far — something you are genuinely proud of.\n\nSpeak about:\n1. What was the achievement?\n2. What challenges did you overcome to get there?\n3. How did it shape who you are today?`,
    evaluationCriteria: 'Evaluate confidence without arrogance, storytelling, self-reflection, articulation' },
  { orderIndex: 23, type: 'personal', speakingTimeSeconds: 30,
    prompt: `Imagine you have been selected as the CEO of a startup for one year. You can build anything you want.\n\nSpeak about:\n1. What problem would you solve?\n2. Why is this problem important to you?\n3. How would you approach building your team?`,
    evaluationCriteria: 'Evaluate vision, creativity, leadership thinking, passion, business sensibility' },
  { orderIndex: 24, type: 'personal', speakingTimeSeconds: 30,
    prompt: `Think about a person who has significantly influenced your life — a teacher, mentor, parent, or friend.\n\nSpeak about:\n1. Who is this person and what is your relationship?\n2. What specific lesson or value did they teach you?\n3. How do you carry that lesson forward?`,
    evaluationCriteria: 'Evaluate emotional depth, gratitude expression, storytelling quality, values articulation' },
  { orderIndex: 25, type: 'personal', speakingTimeSeconds: 30,
    prompt: `Describe a time when you had to work with someone you strongly disagreed with.\n\nSpeak about:\n1. What was the disagreement about?\n2. How did you handle the situation?\n3. What was the outcome?`,
    evaluationCriteria: 'Evaluate conflict resolution, professionalism, perspective-taking, maturity' },
  { orderIndex: 26, type: 'personal', speakingTimeSeconds: 30,
    prompt: `If you could go back and give advice to your 15-year-old self, what would you say?\n\nSpeak about:\n1. What advice would you give and why?\n2. What mistakes would you want to avoid?\n3. What would you want to start doing earlier?`,
    evaluationCriteria: 'Evaluate self-reflection, wisdom, communication warmth, personal insight' },
  { orderIndex: 27, type: 'personal', speakingTimeSeconds: 30,
    prompt: `Describe a skill or hobby that you have taught yourself without formal training.\n\nSpeak about:\n1. What skill is it and how did you learn it?\n2. What challenges did you face while self-learning?\n3. How has this ability to self-learn helped you professionally?`,
    evaluationCriteria: 'Evaluate self-motivation, learning strategy, perseverance, connection to career' },
  { orderIndex: 28, type: 'personal', speakingTimeSeconds: 30,
    prompt: `What does success mean to you? Many people define it differently.\n\nSpeak about:\n1. How do you personally define success?\n2. Is your definition different from what society expects?\n3. What are you doing right now to achieve your version of success?`,
    evaluationCriteria: 'Evaluate depth of thought, originality, self-awareness, articulation of values' },
  { orderIndex: 29, type: 'personal', speakingTimeSeconds: 30,
    prompt: `Describe a time when you had to make a difficult decision with limited information.\n\nSpeak about:\n1. What was the decision?\n2. How did you weigh the options?\n3. Would you make the same decision today?`,
    evaluationCriteria: 'Evaluate decision-making process, analytical thinking, honesty, reflective ability' },
  { orderIndex: 30, type: 'personal', speakingTimeSeconds: 30,
    prompt: `Where do you see yourself in 5 years, and what steps are you taking to get there?\n\nSpeak about:\n1. What is your vision for your career?\n2. What specific steps or plans do you have?\n3. What obstacles do you anticipate?`,
    evaluationCriteria: 'Evaluate ambition, planning ability, realism, articulation of goals' }
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  await CommunicationQuestion.deleteMany({});
  await CommunicationQuestion.insertMany(questions);
  console.log(`Seeded ${questions.length} communication questions (Scenario: ${questions.filter(q=>q.type==='scenario').length}, Comprehension: ${questions.filter(q=>q.type==='read_comprehension').length}, Personal: ${questions.filter(q=>q.type==='personal').length})`);
  await mongoose.disconnect();
}

if (require.main === module) {
  seed().catch(console.error);
}

module.exports = { seed, questions };

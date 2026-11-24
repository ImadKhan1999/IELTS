import type { ObjectiveTest, SpeakingTest, WritingTest } from '../types';

// Original practice material written for this app. Listening audio is generated with the
// browser's text-to-speech from the transcript (one voice per speaker).

export const starterListening: ObjectiveTest[] = [
  {
    id: 'starter-listening-1',
    title: 'Starter Listening 1: Bike Tour & Library',
    skill: 'listening',
    variant: 'academic',
    durationMin: 15,
    source: 'starter',
    collection: 'Starter tests',
    sections: [
      {
        id: 'part1',
        title: 'Part 1',
        transcript: `Agent: Good morning, Riverside Cycle Tours. How can I help you?
Caller: Hi, I'd like to book a place on one of your weekend tours.
Agent: Of course. Can I take your name first?
Caller: Yes, it's Daniel Morton. That's M O R T O N.
Agent: Thank you, Mr Morton. And which tour were you interested in? We have the Castle Route and the Lakeside Route.
Caller: The Lakeside Route, please. Someone told me it's flatter.
Agent: It is, yes. It's about thirty-two kilometres in total, with a stop for lunch.
Caller: Great. Which day does it run?
Agent: The Lakeside tour runs every Sunday. It starts at half past nine from the main square, next to the fountain.
Caller: And do I need to bring my own bike?
Agent: No, bike hire is included, and so is a helmet. You'll just need to bring water and suitable shoes.
Caller: How much does it cost?
Agent: It's forty-five pounds per person, but there's a ten per cent discount if you're a student.
Caller: I'm not a student, unfortunately. Can I give you a phone number?
Agent: Please do.
Caller: It's oh seven seven double four, six one nine, two oh three.
Agent: Lovely. We'll send you a text reminder the day before.`,
        groups: [
          {
            id: 'g1',
            type: 'gap',
            title: 'Questions 1–6',
            instructions: 'Complete the form below. Write ONE WORD AND/OR A NUMBER for each answer.',
            questions: [
              { number: 1, prompt: 'Name: Daniel ___', answer: ['Morton'], evidence: "it's Daniel Morton", explanation: 'The caller spells M O R T O N.' },
              { number: 2, prompt: 'Tour chosen: the ___ Route', answer: ['Lakeside'], evidence: 'The Lakeside Route, please', explanation: 'He chooses the Lakeside Route because it is flatter.' },
              { number: 3, prompt: 'Distance: ___ km', answer: ['32', 'thirty-two'], evidence: "It's about thirty-two kilometres in total", explanation: 'The agent says about thirty-two kilometres.' },
              { number: 4, prompt: 'Day: every ___', answer: ['Sunday'], evidence: 'The Lakeside tour runs every Sunday', explanation: 'Runs every Sunday.' },
              { number: 5, prompt: 'Meeting point: main square, next to the ___', answer: ['fountain'], evidence: 'next to the fountain', explanation: 'It starts from the main square next to the fountain.' },
              { number: 6, prompt: 'Price per person: £___', answer: ['45', 'forty-five'], evidence: "It's forty-five pounds per person", explanation: 'He is not a student, so no discount applies.' },
            ],
          },
        ],
      },
      {
        id: 'part2',
        title: 'Part 2',
        transcript: `Guide: Welcome, everyone, to the new Hillside Community Library. Before you explore, let me tell you a little about the building and the services we offer.
Guide: The library reopened last month after a renovation that took almost two years. The original building dates from 1908, and we have kept the stone front, but everything behind it is new.
Guide: On the ground floor you'll find the children's section, which is much larger than before. Many visitors expect the café to be down here too, but in fact it's on the top floor, where there's a view over the park.
Guide: The first floor is our quiet study area. Please note that phone calls are not allowed anywhere on this floor, although you are welcome to use laptops.
Guide: We've also made borrowing easier. You can now borrow up to fifteen items at a time, and the loan period has been extended from two weeks to three.
Guide: Finally, a popular new service: on Tuesday evenings, volunteers run free sessions helping older residents use their smartphones and tablets. You don't need to book, just turn up.`,
        groups: [
          {
            id: 'g2',
            type: 'mcq',
            title: 'Questions 7–9',
            instructions: 'Choose the correct letter, A, B or C.',
            questions: [
              { number: 7, prompt: 'How long did the renovation take?', options: [{ key: 'A', text: 'about one year' }, { key: 'B', text: 'almost two years' }, { key: 'C', text: 'just over three years' }], answer: ['B'], evidence: 'a renovation that took almost two years', explanation: 'The guide says almost two years.' },
              { number: 8, prompt: 'Where is the café?', options: [{ key: 'A', text: 'on the ground floor' }, { key: 'B', text: 'on the first floor' }, { key: 'C', text: 'on the top floor' }], answer: ['C'], evidence: "in fact it's on the top floor", explanation: 'Many expect the ground floor (a distractor), but it is on the top floor.' },
              { number: 9, prompt: 'What is not allowed on the first floor?', options: [{ key: 'A', text: 'using laptops' }, { key: 'B', text: 'making phone calls' }, { key: 'C', text: 'eating snacks' }], answer: ['B'], evidence: 'phone calls are not allowed anywhere on this floor', explanation: 'Laptops are welcome; phone calls are not allowed.' },
            ],
          },
          {
            id: 'g3',
            type: 'gap',
            title: 'Questions 10–12',
            instructions: 'Complete the sentences below. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
            questions: [
              { number: 10, prompt: 'Members can now borrow up to ___ items.', answer: ['15', 'fifteen'], evidence: 'borrow up to fifteen items at a time', explanation: 'Up to fifteen items at a time.' },
              { number: 11, prompt: 'The loan period is now ___ weeks.', answer: ['3', 'three'], evidence: 'extended from two weeks to three', explanation: 'Extended from two to three weeks.' },
              { number: 12, prompt: 'Technology help sessions take place on ___ evenings.', answer: ['Tuesday'], evidence: 'on Tuesday evenings', explanation: 'Volunteers run sessions on Tuesday evenings.' },
            ],
          },
        ],
      },
    ],
  },
];

export const starterWriting: WritingTest[] = [
  {
    id: 'starter-writing-ac-1',
    title: 'Starter Writing AC 1',
    variant: 'academic',
    source: 'starter',
    task1: {
      prompt: 'The chart below shows the percentage of journeys to work made by bicycle, car and public transport in one city in 2005, 2015 and 2025.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least 150 words.',
      chart: {
        title: 'Journeys to work by transport type',
        unit: '%',
        labels: ['2005', '2015', '2025'],
        series: [
          { name: 'Car', values: [58, 49, 37] },
          { name: 'Public transport', values: [34, 38, 41] },
          { name: 'Bicycle', values: [8, 13, 22] },
        ],
      },
    },
    task2: {
      prompt: 'Some people believe that cities should ban private cars from their centres completely. Others think this would cause more problems than it solves.\n\nDiscuss both views and give your own opinion.\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.\n\nWrite at least 250 words.',
    },
  },
  {
    id: 'starter-writing-ac-2',
    title: 'Starter Writing AC 2',
    variant: 'academic',
    source: 'starter',
    task1: {
      prompt: 'The chart below shows average monthly household spending on four categories in a country in 2010 and 2020.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least 150 words.',
      chart: {
        title: 'Average monthly household spending (USD)',
        unit: '$',
        labels: ['Housing', 'Food', 'Transport', 'Entertainment'],
        series: [
          { name: '2010', values: [820, 410, 260, 140] },
          { name: '2020', values: [1150, 450, 240, 210] },
        ],
      },
    },
    task2: {
      prompt: 'In many countries, young people are leaving rural areas to live and work in cities.\n\nWhat are the reasons for this trend? What problems does it cause, and how could they be solved?\n\nWrite at least 250 words.',
    },
  },
  {
    id: 'starter-writing-gt-1',
    title: 'Starter Writing GT 1',
    variant: 'general',
    source: 'starter',
    task1: {
      prompt: 'You recently stayed at a hotel and left a personal item in your room.\n\nWrite a letter to the hotel manager. In your letter:\n• give details of your stay\n• describe the item you left behind\n• explain how you would like the item returned to you\n\nWrite at least 150 words. Begin your letter: Dear Sir or Madam,',
    },
    task2: {
      prompt: 'Some people think that working from home is better for employees, while others believe that working in an office is more productive.\n\nDiscuss both views and give your own opinion.\n\nWrite at least 250 words.',
    },
  },
];

export const starterSpeaking: SpeakingTest[] = [
  {
    id: 'starter-speaking-1',
    title: 'Starter Speaking 1: Neighbourhoods',
    source: 'starter',
    part1: [
      "Let's talk about where you live. Do you live in a house or an apartment?",
      'What do you like most about your neighbourhood?',
      'Is there anything you would like to change about the area where you live?',
      'Do you know many of your neighbours?',
    ],
    part2: {
      cue: 'Describe a place in your town or city where people like to spend their free time.',
      points: ['where it is', 'what people do there', 'how often you go there', 'and explain why it is popular'],
      followUp: 'Would you recommend this place to a visitor?',
    },
    part3: [
      'Why do you think public spaces such as parks are important in cities?',
      'How have the ways people spend their free time changed in recent years?',
      'Should local governments spend more money on leisure facilities? Why or why not?',
      'Do you think cities will have more or fewer green spaces in the future?',
    ],
  },
  {
    id: 'starter-speaking-2',
    title: 'Starter Speaking 2: Learning',
    source: 'starter',
    part1: [
      'Do you work or are you a student?',
      'What subject did you enjoy most at school?',
      'Do you prefer studying alone or with other people?',
      'Is there anything new you would like to learn in the future?',
    ],
    part2: {
      cue: 'Describe a skill you learned that took a long time to master.',
      points: ['what the skill is', 'when you started learning it', 'why it took a long time', 'and explain how you felt when you finally mastered it'],
    },
    part3: [
      'What skills do you think young people need most today?',
      'Is it better to learn a skill from a teacher or from online videos?',
      'Why do some people give up learning new things as they get older?',
      'How might technology change the way people learn in the future?',
    ],
  },
];

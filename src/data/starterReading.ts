import type { ObjectiveTest } from '../types';

// Original practice material written for this app.

const farmPassage = `A. When the first commercial vertical farm opened in a disused warehouse on the edge of a northern European city, many agricultural economists dismissed it as an expensive curiosity. Growing lettuce under pink LED lights, stacked eight shelves high, seemed an odd answer to the problem of feeding a growing urban population. Two decades later, the sceptics have not entirely disappeared, but the sector has grown into an industry worth several billion dollars.

B. The appeal of vertical farming rests on control. Inside a sealed building, temperature, humidity, light and nutrients can be adjusted to the precise needs of each crop. Because there is no soil, plants are grown hydroponically, with their roots suspended in a mineral solution that is constantly recycled. Operators claim that this method uses up to ninety-five per cent less water than conventional field farming, and since insects cannot easily enter, pesticides are rarely needed.

C. Location is the second advantage. A farm placed inside a city can deliver produce to supermarkets within hours of harvest, rather than days. Leafy greens, which lose flavour and nutritional value quickly after picking, benefit most from this shorter journey. Some restaurants have even installed small growing cabinets in their dining rooms, allowing chefs to cut herbs minutes before they reach the plate.

D. The greatest obstacle, however, is energy. Sunlight is free; artificial light is not. Early vertical farms spent as much as half of their running costs on electricity, and several well-funded companies collapsed when energy prices rose sharply. Engineers have responded by developing more efficient lighting that emits only the red and blue wavelengths plants actually use, and by locating farms next to sources of cheap renewable power, such as wind parks or hydroelectric dams.

E. Critics also point out that the range of crops is narrow. Lettuce, herbs and microgreens grow quickly and are light, so they generate revenue per square metre that justifies the investment. Staple crops such as wheat or rice, by contrast, need far more space and time, and are sold at prices too low to cover indoor production costs. For the foreseeable future, therefore, vertical farms are likely to complement rather than replace traditional agriculture.

F. Nonetheless, researchers remain optimistic about the technology's long-term role. Experiments with strawberries and dwarf varieties of tomato have produced promising yields, and plant breeders are now developing varieties specifically for indoor conditions, selecting for compact growth rather than resistance to wind or drought. In regions with extreme climates or very little fertile land, from desert states to small island nations, indoor farming may become one of the few practical ways to grow fresh food locally.`;

const heatPassage = `A. On a still summer evening, the centre of a large city can be several degrees warmer than the surrounding countryside. This phenomenon, known as the urban heat island effect, was first recorded in the early nineteenth century by an amateur meteorologist who noticed that his thermometer in town consistently read higher than one placed in a nearby village. Today, satellites can map these temperature differences street by street.

B. The causes are well understood. Dark surfaces such as asphalt roads and tar roofs absorb sunlight during the day and release the stored heat slowly after sunset. Tall buildings trap this warm air and block cooling breezes, while air-conditioning units, vehicles and factories add heat of their own. Perhaps most importantly, cities have far fewer trees and open water surfaces, which cool the air naturally through evaporation.

C. The consequences go beyond discomfort. During heatwaves, hospital admissions rise sharply, particularly among elderly people and those living alone in poorly ventilated flats. Higher temperatures also increase demand for air conditioning, which in turn raises electricity consumption and, if the power comes from fossil fuels, greenhouse gas emissions. Some studies suggest that ground-level ozone, a harmful pollutant, forms more readily in hotter urban air.

D. City authorities have begun to fight back with a range of measures. Painting roofs white or pale grey reflects a large share of incoming sunlight, and in some cities this has become compulsory for new commercial buildings. Planting street trees provides shade and evaporative cooling, while "green roofs" covered with grasses and low plants insulate buildings and absorb rainwater. A few cities have gone further, uncovering rivers that were buried under concrete in the past century.

E. Not every solution is straightforward. Reflective surfaces at street level can dazzle pedestrians and bounce heat onto nearby walls, and trees need water, space for roots and years of maintenance before they deliver their full benefit. Planners therefore increasingly favour combining several approaches, guided by detailed heat maps that show exactly which neighbourhoods suffer most. In my view, these maps are the single most valuable tool a city can invest in, because they direct limited budgets to where they will save the most lives.`;

export const starterReading: ObjectiveTest[] = [
  {
    id: 'starter-reading-1',
    title: 'Starter Reading 1: Indoor Farming',
    skill: 'reading',
    variant: 'academic',
    durationMin: 20,
    source: 'starter',
    collection: 'Starter tests',
    sections: [
      {
        id: 'p1',
        title: 'Passage 1',
        passageTitle: 'Farming without fields',
        passage: farmPassage,
        groups: [
          {
            id: 'g1',
            type: 'tfng',
            title: 'Questions 1–5',
            instructions: 'Do the following statements agree with the information given in the passage? Choose TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, NOT GIVEN if there is no information on this.',
            questions: [
              { number: 1, prompt: 'All agricultural economists now accept that vertical farming is worthwhile.', answer: ['FALSE'], evidence: 'the sceptics have not entirely disappeared', explanation: 'The passage says sceptics still exist, so not all economists accept it.' },
              { number: 2, prompt: 'Vertical farms grow plants without soil.', answer: ['TRUE'], evidence: 'Because there is no soil, plants are grown hydroponically', explanation: 'Paragraph B states there is no soil; roots sit in a mineral solution.' },
              { number: 3, prompt: 'Vertical farms never use pesticides.', answer: ['FALSE'], evidence: 'pesticides are rarely needed', explanation: '"Rarely" means sometimes, which contradicts "never".' },
              { number: 4, prompt: 'Restaurants with growing cabinets attract more customers.', answer: ['NOT GIVEN'], evidence: 'Some restaurants have even installed small growing cabinets in their dining rooms', explanation: 'The cabinets are mentioned, but nothing is said about customer numbers.' },
              { number: 5, prompt: 'Some vertical farming companies failed because of rising energy costs.', answer: ['TRUE'], evidence: 'several well-funded companies collapsed when energy prices rose sharply', explanation: 'Paragraph D says companies collapsed when energy prices rose.' },
            ],
          },
          {
            id: 'g2',
            type: 'gap',
            title: 'Questions 6–9',
            instructions: 'Complete the summary below. Choose NO MORE THAN TWO WORDS from the passage for each answer.',
            questions: [
              { number: 6, prompt: 'To reduce electricity use, engineers created lighting that only produces ___ wavelengths.', answer: ['red and blue'], evidence: 'emits only the red and blue wavelengths plants actually use', explanation: 'The lights emit only red and blue wavelengths.' },
              { number: 7, prompt: 'Farms are also built close to cheap ___ power.', answer: ['renewable'], evidence: 'sources of cheap renewable power', explanation: 'Farms are located next to sources of cheap renewable power.' },
              { number: 8, prompt: 'Crops such as wheat and rice are called ___ crops.', answer: ['staple'], evidence: 'Staple crops such as wheat or rice', explanation: 'Paragraph E calls wheat and rice staple crops.' },
              { number: 9, prompt: 'New plant varieties are selected for ___ rather than resistance to weather.', answer: ['compact growth'], evidence: 'selecting for compact growth rather than resistance to wind or drought', explanation: 'Breeders select for compact growth.' },
            ],
          },
          {
            id: 'g3',
            type: 'match',
            title: 'Questions 10–13',
            instructions: 'Which paragraph contains the following information? Choose the correct letter, A–F.',
            options: ['A', 'B', 'C', 'D', 'E', 'F'].map((k) => ({ key: k, text: `Paragraph ${k}` })),
            questions: [
              { number: 10, prompt: 'a reason why some foods benefit from being grown near consumers', answer: ['C'], evidence: 'Leafy greens, which lose flavour and nutritional value quickly after picking', explanation: 'Paragraph C explains leafy greens lose quality quickly, so a short journey helps.' },
              { number: 11, prompt: 'places where indoor farming may be especially useful', answer: ['F'], evidence: 'In regions with extreme climates or very little fertile land', explanation: 'Paragraph F names regions with extreme climates or little fertile land.' },
              { number: 12, prompt: 'a comparison of water use between two farming methods', answer: ['B'], evidence: 'uses up to ninety-five per cent less water than conventional field farming', explanation: 'Paragraph B compares water use with field farming.' },
              { number: 13, prompt: 'the reason certain crops are profitable indoors', answer: ['E'], evidence: 'they generate revenue per square metre that justifies the investment', explanation: 'Paragraph E explains fast, light crops earn enough per square metre.' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'starter-reading-2',
    title: 'Starter Reading 2: City Heat',
    skill: 'reading',
    variant: 'academic',
    durationMin: 20,
    source: 'starter',
    collection: 'Starter tests',
    sections: [
      {
        id: 'p1',
        title: 'Passage 1',
        passageTitle: 'Cooling the urban heat island',
        passage: heatPassage,
        groups: [
          {
            id: 'g1',
            type: 'match',
            title: 'Questions 1–5',
            instructions: 'The passage has five paragraphs, A–E. Choose the correct heading for each paragraph from the list of headings below.',
            options: [
              { key: 'i', text: 'Why cities trap heat' },
              { key: 'ii', text: 'The drawbacks of some remedies' },
              { key: 'iii', text: 'A history of air pollution laws' },
              { key: 'iv', text: 'Measuring an old observation with new tools' },
              { key: 'v', text: 'Effects on health and energy' },
              { key: 'vi', text: 'Practical steps taken by cities' },
              { key: 'vii', text: 'The cost of air conditioning for households' },
            ],
            questions: [
              { number: 1, prompt: 'Paragraph A', answer: ['iv'], evidence: 'Today, satellites can map these temperature differences street by street', explanation: 'A 19th-century observation is now measured by satellites.' },
              { number: 2, prompt: 'Paragraph B', answer: ['i'], evidence: 'The causes are well understood', explanation: 'Paragraph B lists the causes of urban heat.' },
              { number: 3, prompt: 'Paragraph C', answer: ['v'], evidence: 'hospital admissions rise sharply', explanation: 'Covers health (hospital admissions) and energy (electricity use).' },
              { number: 4, prompt: 'Paragraph D', answer: ['vi'], evidence: 'City authorities have begun to fight back with a range of measures', explanation: 'Describes measures: white roofs, trees, green roofs, uncovered rivers.' },
              { number: 5, prompt: 'Paragraph E', answer: ['ii'], evidence: 'Not every solution is straightforward', explanation: 'Discusses problems with reflective surfaces and trees.' },
            ],
          },
          {
            id: 'g2',
            type: 'multi',
            title: 'Questions 6–7',
            instructions: 'Choose TWO letters, A–E. Which TWO causes of urban heat are mentioned in the passage?',
            options: [
              { key: 'A', text: 'heat produced by vehicles' },
              { key: 'B', text: 'a lack of rainfall in cities' },
              { key: 'C', text: 'buildings that block wind' },
              { key: 'D', text: 'the height of the sun in summer' },
              { key: 'E', text: 'smoke from domestic fires' },
            ],
            questions: [
              { number: 6, answer: ['A'], evidence: 'air-conditioning units, vehicles and factories add heat of their own', explanation: 'Vehicles add heat of their own.' },
              { number: 7, answer: ['C'], evidence: 'Tall buildings trap this warm air and block cooling breezes', explanation: 'Tall buildings block cooling breezes.' },
            ],
          },
          {
            id: 'g3',
            type: 'ynng',
            title: 'Questions 8–10',
            instructions: 'Do the following statements agree with the views of the writer? Choose YES if the statement agrees with the views of the writer, NO if the statement contradicts the views of the writer, NOT GIVEN if it is impossible to say what the writer thinks about this.',
            questions: [
              { number: 8, prompt: 'Heat maps are the most useful investment a city can make on this problem.', answer: ['YES'], evidence: 'these maps are the single most valuable tool a city can invest in', explanation: 'The writer calls them the single most valuable tool.' },
              { number: 9, prompt: 'Green roofs are more effective than white roofs.', answer: ['NOT GIVEN'], evidence: '"green roofs" covered with grasses and low plants', explanation: 'Both are described, but the writer never compares their effectiveness.' },
              { number: 10, prompt: 'Planting trees gives immediate results.', answer: ['NO'], evidence: 'years of maintenance before they deliver their full benefit', explanation: 'Trees need years before delivering their full benefit.' },
            ],
          },
          {
            id: 'g4',
            type: 'mcq',
            title: 'Questions 11–13',
            instructions: 'Choose the correct letter, A, B, C or D.',
            questions: [
              {
                number: 11,
                prompt: 'The urban heat island effect was first noticed by',
                options: [
                  { key: 'A', text: 'a team using satellite images.' },
                  { key: 'B', text: 'a non-professional weather observer.' },
                  { key: 'C', text: 'a doctor treating heat-related illness.' },
                  { key: 'D', text: 'city planners designing new roads.' },
                ],
                answer: ['B'],
                evidence: 'by an amateur meteorologist',
                explanation: 'An amateur meteorologist is a non-professional weather observer.',
              },
              {
                number: 12,
                prompt: 'According to paragraph C, air conditioning can',
                options: [
                  { key: 'A', text: 'reduce hospital admissions during heatwaves.' },
                  { key: 'B', text: 'lower levels of ground-level ozone.' },
                  { key: 'C', text: 'lead to higher emissions.' },
                  { key: 'D', text: 'make flats better ventilated.' },
                ],
                answer: ['C'],
                evidence: 'raises electricity consumption and, if the power comes from fossil fuels, greenhouse gas emissions',
                explanation: 'More air conditioning raises electricity use and, with fossil fuels, emissions.',
              },
              {
                number: 13,
                prompt: 'Why do planners now combine several approaches?',
                options: [
                  { key: 'A', text: 'Because single measures have limitations.' },
                  { key: 'B', text: 'Because the law requires it.' },
                  { key: 'C', text: 'Because residents asked for more trees.' },
                  { key: 'D', text: 'Because white roofs are too expensive.' },
                ],
                answer: ['A'],
                evidence: 'Planners therefore increasingly favour combining several approaches',
                explanation: '"Therefore" links back to the drawbacks of individual solutions.',
              },
            ],
          },
        ],
      },
    ],
  },
];

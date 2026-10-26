import { copiesDefinition } from './copycheck';

const meaning = 'the ability to change or choose easily, for example your working hours';

test('blocks a copied definition', () => {
  expect(copiesDefinition('Flexibility is the ability to change or choose easily, for example your working hours.', meaning, 'flexibility')).toBe(true);
});

test('blocks a lightly reworded definition', () => {
  expect(copiesDefinition('Flexibility is when you can change or choose your working hours easily.', meaning, 'flexibility')).toBe(true);
});

test('allows a real sentence that shares a word or two', () => {
  expect(copiesDefinition('Flexible working hours let parents collect their children from school on time.', meaning, 'flexibility')).toBe(false);
  expect(copiesDefinition('Many companies now offer flexibility, which helps employees avoid the rush hour.', meaning, 'flexibility')).toBe(false);
});

test('short meanings are not judged', () => {
  expect(copiesDefinition('Governments must mitigate pollution in big cities.', 'reduce', 'mitigate')).toBe(false);
});

// SAT Math · Algebra · Medium — College Board question bank export (2026-10-28), transcribed.
// Linear equations in one variable (20) + linear equations in two variables (part 1).
const R = String.raw;
export const ce = (...L) => L.map((l) => `Choice ${l} is incorrect and may result from conceptual or calculation errors.`).join('\n\n');
export const cerr = (...L) => L.map((l) => `Choice ${l} is incorrect and may result from conceptual errors.`).join('\n\n');

export default [
  {
    id: '9d4270fe', skill: 'Linear equations in one variable', type: 'mcq', answer: 'A',
    prompt: R`A company that creates and sells tape dispensers calculates its monthly profit, in dollars, by subtracting its fixed monthly costs, in dollars, from its monthly sales revenue, in dollars. The equation \(15{,}000 = 2.00x - 4{,}500\) represents this situation for a month where \(x\) tape dispensers are created and sold. Which statement is the best interpretation of \(2.00x\) in this context?`,
    options: [
      R`The monthly sales revenue, in dollars, from selling \(x\) tape dispensers`,
      R`The monthly sales revenue, in dollars, from each tape dispenser sold`,
      R`The monthly cost, in dollars, of creating each tape dispenser`,
      R`The monthly cost, in dollars, of creating \(x\) tape dispensers`,
    ],
    explanation: R`Choice A is correct. It's given that the equation \(15{,}000 = 2.00x - 4{,}500\) represents this situation for a month where \(x\) tape dispensers are created and sold. It's also given that the company calculates its monthly profit, in dollars, by subtracting its fixed monthly costs, in dollars, from its monthly sales revenue, in dollars. It follows that \(2.00x\) represents the monthly sales revenue, in dollars. Therefore, the best interpretation of \(2.00x\) in this context is the monthly sales revenue from selling \(x\) tape dispensers.

Choice B is incorrect. This is the best interpretation of \(2.00\), not \(2.00x\).

Choice C is incorrect and may result from conceptual errors.

Choice D is incorrect. This is the best interpretation of \(4{,}500\), not \(2.00x\).`,
  },
  {
    id: '7a5a74a6', skill: 'Linear equations in one variable', type: 'mcq', answer: 'B',
    prompt: R`\[3(2x-6)-11=4(x-3)+6\]
If x is the solution to the equation above, what is the value of \(x-3\)?`,
    options: [R`\(\dfrac{23}{2}\)`, R`\(\dfrac{17}{2}\)`, R`\(\dfrac{15}{2}\)`, R`\(-\dfrac{15}{2}\)`],
    explanation: R`Choice B is correct. Because 2 is a factor of both \(2x\) and 6, the expression \(2x-6\) can be rewritten as \(2(x-3)\). Substituting \(2(x-3)\) for \((2x-6)\) on the left-hand side of the given equation yields \(3(2)(x-3)-11=4(x-3)+6\), or \(6(x-3)-11=4(x-3)+6\). Subtracting \(4(x-3)\) from both sides of this equation yields \(2(x-3)-11=6\). Adding 11 to both sides of this equation yields \(2(x-3)=17\). Dividing both sides of this equation by 2 yields \(x-3=\frac{17}{2}\).

Alternate approach: Distributing 3 to the quantity \((2x-6)\) on the left-hand side of the given equation and distributing 4 to the quantity \((x-3)\) on the right-hand side yields \(6x-18-11=4x-12+6\), or \(6x-29=4x-6\). Subtracting \(4x\) from both sides of this equation yields \(2x-29=-6\). Adding 29 to both sides of this equation yields \(2x=23\). Dividing both sides of this equation by 2 yields \(x=\frac{23}{2}\). Therefore, the value of \(x-3\) is \(\frac{23}{2}-3\), or \(\frac{17}{2}\).

Choice A is incorrect. This is the value of x, not \(x-3\). Choices C and D are incorrect. If the value of \(x-3\) is \(\frac{15}{2}\) or \(-\frac{15}{2}\), it follows that the value of x is \(\frac{21}{2}\) or \(-\frac{9}{2}\), respectively. However, solving the given equation for x yields \(x=\frac{23}{2}\). Therefore, the value of \(x-3\) can't be \(\frac{15}{2}\) or \(-\frac{15}{2}\).`,
  },
  {
    id: 'aa85b138', skill: 'Linear equations in one variable', type: 'mcq', answer: 'B',
    prompt: R`\[2n+6=14\]
A tree had a height of 6 feet when it was planted. The equation above can be used to find how many years n it took the tree to reach a height of 14 feet. Which of the following is the best interpretation of the number 2 in this context?`,
    options: [
      'The number of years it took the tree to double its height',
      'The average number of feet that the tree grew per year',
      'The height, in feet, of the tree when the tree was 1 year old',
      'The average number of years it takes similar trees to grow 14 feet',
    ],
    explanation: R`Choice B is correct. The height of the tree at a given time is equal to its height when it was planted plus the number of feet that the tree grew. In the given equation, 14 represents the height of the tree at the given time, and 6 represents the height of the tree when it was planted. It follows that \(2n\) represents the number of feet the tree grew from the time it was planted until the time it reached a height of 14 feet. Since n represents the number of years between the given time and the time the tree was planted, 2 must represent the average number of feet the tree grew each year.

Choice A is incorrect and may result from interpreting the coefficient 2 as doubling instead of as increasing by 2 each year. Choice C is incorrect. The height of the tree when it was 1 year old was \(2(1)+6=8\) feet, not 2 feet. Choice D is incorrect. No information is given to connect the growth of one particular tree to the growth of similar trees.`,
  },
  {
    id: '15daa8d6', skill: 'Linear equations in one variable', type: 'spr', accepted: ['2'],
    prompt: R`\[2x+16=a(x+8)\]
In the given equation, \(a\) is a constant. If the equation has infinitely many solutions, what is the value of \(a\)?`,
    explanation: R`The correct answer is \(2\). An equation with one variable, \(x\), has infinitely many solutions only when both sides of the equation are equal for any defined value of \(x\). It's given that \(2x+16=a(x+8)\), where \(a\) is a constant. This equation can be rewritten as \(2(x+8)=a(x+8)\). If this equation has infinitely many solutions, then both sides of this equation are equal for any defined value of \(x\). Both sides of this equation are equal for any defined value of \(x\) when \(2=a\). Therefore, if the equation has infinitely many solutions, the value of \(a\) is \(2\).

Alternate approach: If the given equation, \(2x+16=a(x+8)\), has infinitely many solutions, then both sides of this equation are equal for any value of \(x\). If \(x=0\), then substituting \(0\) for \(x\) in \(2x+16=a(x+8)\) yields \(2(0)+16=a(0+8)\), or \(16=8a\). Dividing both sides of this equation by \(8\) yields \(2=a\).`,
  },
  {
    id: '088bc84e', skill: 'Linear equations in one variable', type: 'mcq', answer: 'C',
    prompt: R`If \(2(5x)=6\), what is the value of \(5x\)?`,
    options: [R`\(\dfrac{4}{5}\)`, R`\(\dfrac{5}{3}\)`, R`\(3\)`, R`\(4\)`],
    explanation: R`Choice C is correct. Dividing both sides of the given equation by \(2\) yields \(5x=3\). Therefore, the value of \(5x\) is \(3\).` + '\n\n' + ce('A', 'B', 'D'),
  },
  {
    id: '12ee1edc', skill: 'Linear equations in one variable', type: 'mcq', answer: 'A',
    prompt: R`\[(b-2)x=8\]
In the given equation, b is a constant. If the equation has no solution, what is the value of b ?`,
    options: ['2', '4', '6', '10'],
    explanation: R`Choice A is correct. This equation has no solution when there is no value of x that produces a true statement. Solving the given equation for x by dividing both sides by \((b-2)\) gives \(x=\frac{8}{(b-2)}\). When \((b-2)=0\), the right-hand side of this equation will be undefined, and the equation will have no solution. Therefore, when \(b=2\), there is no value of x that satisfies the given equation.

Choices B, C, and D are incorrect. Substituting 4, 6, and 10 for b in the given equation yields exactly one solution, rather than no solution, for x. For example, substituting 4 for b in the given equation yields \((4-2)x=8\), or \(2x=8\). Dividing both sides of \(2x=8\) by 2 yields \(x=4\). Similarly, if \(b=6\) or \(b=10\), \(x=2\) and \(x=1\), respectively.`,
  },
  {
    id: 'f8fa0cf0', skill: 'Linear equations in one variable', type: 'spr', accepted: ['24.5', '49/2'],
    prompt: R`\[9r=7(r+7)\]
What value of \(r\) is the solution to the given equation?`,
    explanation: R`The correct answer is \(\frac{49}{2}\). It's given that \(9r=7(r+7)\). Applying the distributive property on the right-hand side of this equation yields \(9r=7r+49\). Subtracting \(7r\) from both sides of this equation yields \(2r=49\). Dividing both sides of this equation by \(2\) yields \(r=\frac{49}{2}\). Therefore, the solution to the given equation is \(\frac{49}{2}\). Note that 49/2 and 24.5 are examples of ways to enter a correct answer.`,
  },
  {
    id: '018a2704', skill: 'Linear equations in one variable', type: 'mcq', answer: 'C',
    prompt: R`If \(46=16+2(x-8)\), what is the value of \(2(x-8)\)?`,
    options: [R`\(16\)`, R`\(23\)`, R`\(30\)`, R`\(38\)`],
    explanation: R`Choice C is correct. Subtracting \(16\) from both sides of the given equation yields \(30=2(x-8)\). Therefore, the value of \(2(x-8)\) is \(30\).` + '\n\n' + ce('A', 'B', 'D'),
  },
  {
    id: '70e29454', skill: 'Linear equations in one variable', type: 'mcq', answer: 'B',
    prompt: R`\[a(3-x)-b=-1-2x\]
In the equation above, a and b are constants. If the equation has infinitely many solutions, what are the values of a and b ?`,
    options: [R`\(a=2\) and \(b=1\)`, R`\(a=2\) and \(b=7\)`, R`\(a=-2\) and \(b=5\)`, R`\(a=-2\) and \(b=-5\)`],
    explanation: `Choice B is correct. Distributing the a on the left-hand side of the equation gives 3a – b – ax = –1 – 2x. Rearranging the terms in each side of the equation yields –ax + 3a – b = –2x –1. Since the equation has infinitely many solutions, it follows that the coefficients of x and the free terms on both sides must be equal. That is, –a = –2, or a = 2, and 3a – b = –1. Substituting 2 for a in the equation 3a – b = –1 gives 3(2) – b = –1, so b = 7.

Choice A is incorrect and may be the result of a conceptual error when finding the value of b. Choices C and D are incorrect and may result from making a sign error when simplifying.`,
  },
  {
    id: 'f09097b1', skill: 'Linear equations in one variable', type: 'spr', accepted: ['22.4', '112/5'],
    prompt: 'An agricultural scientist studying the growth of corn plants recorded the height of a corn plant at the beginning of a study and the height of the plant each day for the next 12 days. The scientist found that the height of the plant increased by an average of 1.20 centimeters per day for the 12 days. If the height of the plant on the last day of the study was 36.8 centimeters, what was the height, in centimeters, of the corn plant at the beginning of the study?',
    explanation: R`The correct answer is 22.4. If the height of the plant increased by an average of 1.20 centimeters per day for 12 days, then its total growth over the 12 days was \((1.20)(12)=14.4\) centimeters. The plant was 36.8 centimeters tall after 12 days, so at the beginning of the study its height was \(36.8-14.4=22.4\) centimeters. Note that 22.4 and 112/5 are examples of ways to enter a correct answer.

Alternate approach: The equation \(36.8=12(1.20)+h\) can be used to represent this situation, where h is the height of the plant, in centimeters, at the beginning of the study. Solving this equation for h yields 22.4 centimeters.`,
  },
  {
    id: '620abf36', skill: 'Linear equations in one variable', type: 'mcq', answer: 'C',
    prompt: R`If \(5(x+4)=4(x+4)+29\), what is the value of \(x+4\)?`,
    options: [R`\(-4\)`, R`\(25\)`, R`\(29\)`, R`\(33\)`],
    explanation: R`Choice C is correct. Subtracting \(4(x+4)\) from both sides of the given equation yields \(1(x+4)=29\), or \(x+4=29\). Therefore, the value of \(x+4\) is \(29\).

Choice A is incorrect and may result from conceptual or calculation errors.

Choice B is incorrect. This is the value of \(x\), not \(x+4\).

Choice D is incorrect and may result from conceptual or calculation errors.`,
  },
  {
    id: '4f669597', skill: 'Linear equations in one variable', type: 'spr', accepted: ['1.2', '6/5'],
    prompt: R`\[2(p+1)+8(p-1)=5p\]
What value of p is the solution of the equation above?`,
    explanation: R`The correct answer is 1.2. One way to solve the equation \(2(p+1)+8(p-1)=5p\) is to first distribute the terms outside the parentheses to the terms inside the parentheses: \(2p+2+8p-8=5p\). Next, combine like terms on the left side of the equal sign: \(10p-6=5p\). Subtracting 10p from both sides yields \(-6=-5p\). Finally, dividing both sides by \(-5\) gives \(p=\frac{6}{5}\), which is equivalent to \(p=1.2\). Note that 1.2 and 6/5 are examples of ways to enter a correct answer.`,
  },
  {
    id: 'ce314070', skill: 'Linear equations in one variable', type: 'mcq', answer: 'D',
    prompt: R`If \(4x-\dfrac{1}{2}=-5\), what is the value of \(8x-1\)?`,
    options: ['2', R`\(-\dfrac{9}{8}\)`, R`\(-\dfrac{5}{2}\)`, R`\(-10\)`],
    explanation: R`Choice D is correct. Multiplying the given equation by 2 on each side yields \(2\left(4x-\frac{1}{2}\right)=2(-5)\). Applying the distributive property, this equation can be rewritten as \(2(4x)-2\left(\frac{1}{2}\right)=2(-5)\), or \(8x-1=-10\).

Choices A, B, and C are incorrect and may result from calculation errors in solving the given equation for \(x\) and then substituting that value of x in the expression \(8x-1\).`,
  },
  {
    id: 'feb78194', skill: 'Linear equations in one variable', type: 'spr', accepted: ['37'],
    prompt: R`A museum rents tablets to visitors. The museum earns revenue of \(\$14\) for each tablet rented for the day. On Wednesday, the museum earned \(\$406\) in profit from renting tablets after paying daily expenses of \(\$112\). How many tablets did the museum rent on Wednesday?
\[(\textbf{profit} = \textbf{total revenue} - \textbf{total expenses})\]`,
    explanation: R`The correct answer is \(37\). It's given that the museum earns revenue of \(\$14\) for each tablet rented for the day. It's also given that on Wednesday, the museum earned \(\$406\) in profit from renting tablets after paying daily expenses of \(\$112\). Let \(x\) represent the number of tablets the museum rented on Wednesday. It follows that the total revenue can be represented by the expression \(14x\). Because \(\text{profit} = \text{total revenue} - \text{total expenses}\), the equation \(406=14x-112\) represents this situation. Adding \(112\) to both sides of this equation yields \(14x=518\). Dividing both sides of this equation by \(14\) yields \(x=37\). Therefore, the museum rented \(37\) tablets on Wednesday.`,
  },
  {
    id: 'ce6b52d8', skill: 'Linear equations in one variable', type: 'spr', accepted: ['60'],
    prompt: R`If \(2(3t-10)+t=40+4t\), what is the value of \(3t\)?`,
    explanation: R`The correct answer is \(60\). Subtracting \(t\) from both sides of the given equation yields \(2(3t-10)=40+3t\). Applying the distributive property to the left-hand side of this equation yields \(6t-20=40+3t\). Adding \(20\) to both sides of this equation yields \(6t=60+3t\). Subtracting \(3t\) from both sides of this equation yields \(3t=60\). Therefore, the value of \(3t\) is \(60\).`,
  },
  {
    id: '76f29fa5', skill: 'Linear equations in one variable', type: 'mcq', answer: 'C',
    prompt: R`The cost to rent a commercial fishing boat from a certain company is \(\$950\) for the first \(2\) hours and an additional \(\$50\) per hour for each hour after the first \(2\) hours. If the total cost to rent the commercial fishing boat from the company for \(t\) hours, where \(t>2\), is \(\$1{,}100\), which equation represents this situation?`,
    options: [R`\(950(t-2)+50t=1{,}100\)`, R`\(950(2t)+50t=1{,}100\)`, R`\(950+50(t-2)=1{,}100\)`, R`\(950+50(2t)=1{,}100\)`],
    explanation: R`Choice C is correct. It's given that the cost to rent a commercial fishing boat is \(\$950\) for the first \(2\) hours and an additional \(\$50\) per hour for each hour after the first \(2\) hours. It's also given that \(t\) represents the total number of hours and \(t>2\). Therefore, the number of additional hours after the first \(2\) hours can be represented with the expression \(t-2\). The cost for these additional hours is \(\$50\) per hour, so the cost for the additional hours can be represented by the expression \(50(t-2)\). The total cost can be calculated by adding the cost for the first \(2\) hours to the cost for the additional hours and can be represented by the expression \(950+50(t-2)\). It's also given that the total cost to rent the commercial fishing boat from the company for \(t\) hours is \(\$1{,}100\). Thus, the equation that represents this situation is \(950+50(t-2)=1{,}100\).` + '\n\n' + cerr('A', 'B', 'D'),
  },
  {
    id: '36ab4122', skill: 'Linear equations in one variable', type: 'mcq', answer: 'B',
    prompt: 'Megan’s regular wage at her job is p dollars per hour for the first 8 hours of work in a day plus 1.5 times her regular hourly wage for work in excess of 8 hours that day. On a given day, Megan worked for 10 hours, and her total earnings for that day were $137.50. What is Megan’s regular hourly wage?',
    options: ['$11.75', '$12.50', '$13.25', '$13.75'],
    explanation: `Choice B is correct. Since p represents Megan’s regular pay per hour, 1.5p represents the pay per hour in excess of 8 hours. Since Megan worked for 10 hours, she must have been paid p dollars per hour for 8 of the hours plus 1.5p dollars per hour for the remaining 2 hours. Therefore, since Megan earned $137.50 for the 10 hours, the situation can be represented by the equation 137.5 = 8p + 2(1.5)p. Distributing the 2 in the equation gives 137.5 = 8p + 3p, and combining like terms gives 137.5 = 11p. Dividing both sides by 11 gives p = 12.5. Therefore, Megan’s regular wage is $12.50.

Choices A and C are incorrect and may be the result of calculation errors. Choice D is incorrect and may result from finding the average hourly wage that Megan earned for the 10 hours of work.`,
  },
  {
    id: '5ad9eff0', skill: 'Linear equations in one variable', type: 'mcq', answer: 'B',
    prompt: 'The width of a rectangular dance floor is w feet. The length of the floor is 6 feet longer than its width. Which of the following expresses the perimeter, in feet, of the dance floor in terms of w ?',
    options: [R`\(2w+6\)`, R`\(4w+12\)`, R`\(w^2+6\)`, R`\(w^2+6w\)`],
    explanation: R`Choice B is correct. It is given that the width of the dance floor is w feet. The length is 6 feet longer than the width; therefore, the length of the dance floor is \(w+6\). So the perimeter is \(w+w+(w+6)+(w+6)=4w+12\).

Choice A is incorrect because it is the sum of one length and one width, which is only half the perimeter. Choice C is incorrect and may result from using the formula for the area instead of the formula for the perimeter and making a calculation error. Choice D is incorrect because this is the area, not the perimeter, of the dance floor.`,
  },
  {
    id: '45bba652', skill: 'Linear equations in one variable', type: 'mcq', answer: 'A',
    prompt: R`If \(2(x-5)+3(x-5)=10\), what is the value of \(x-5\) ?`,
    options: ['2', '5', '7', '12'],
    explanation: R`Choice A is correct. Adding the like terms on the left-hand side of the given equation yields \(5(x-5)=10\). Dividing both sides of this equation by 5 yields \(x-5=2\).

Choice B is incorrect and may result from subtracting 5, not dividing by 5, on both sides of the equation \(5(x-5)=10\). Choice C is incorrect. This is the value of x, not the value of \(x-5\). Choice D is incorrect. This is the value of \(x+5\), not the value of \(x-5\).`,
  },
  {
    id: '8c515062', skill: 'Linear equations in one variable', type: 'mcq', answer: 'D',
    prompt: R`A candle is made of \(17\) ounces of wax. When the candle is burning, the amount of wax in the candle decreases by \(1\) ounce every \(4\) hours. If \(6\) ounces of wax remain in this candle, for how many hours has it been burning?`,
    options: [R`\(3\)`, R`\(6\)`, R`\(24\)`, R`\(44\)`],
    explanation: R`Choice D is correct. It's given that the candle starts with \(17\) ounces of wax and has \(6\) ounces of wax remaining after a period of time has passed. The amount of wax the candle has lost during the time period can be found by subtracting the remaining amount of wax from the amount of wax the candle was made of, which yields \(17-6\) ounces, or \(11\) ounces. This means the candle loses \(11\) ounces of wax during that period of time. It's given that the amount of wax decreases by \(1\) ounce every \(4\) hours. If \(h\) represents the number of hours the candle has been burning, it follows that \(\frac{1}{4}=\frac{11}{h}\). Multiplying both sides of this equation by \(4h\) yields \(h=44\). Therefore, the candle has been burning for \(44\) hours.

Choice A is incorrect and may result from using the equation \(\frac{1}{4}=\frac{h}{11}\) rather than \(\frac{1}{4}=\frac{11}{h}\) to represent the situation, and then rounding to the nearest whole number.

Choice B is incorrect. This is the amount of wax, in ounces, remaining in the candle, not the number of hours it has been burning.

Choice C is incorrect and may result from using the equation \(\frac{1}{4}=\frac{6}{h}\) rather than \(\frac{1}{4}=\frac{11}{h}\) to represent the situation.`,
  },
];

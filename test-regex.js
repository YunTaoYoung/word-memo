const testCases = [
  'hello,world',
  '(hello)',
  '"hello"',
  '[hello]',
  '{hello}',
  '<hello>',
  'hello!',
  'hello.',
  'hello?',
  'hello;',
  'hello:',
  "'hello'",
  'hello/world',
  'hello@world',
  'hello#world',
  'hello$world',
  "It's",
  "don't",
  'café',  // 带重音符号
  'naïve', // 带分音符
  '中文hello世界',
  'hello—world', // 破折号
  'hello–world', // 短破折号
  'hello...world', // 省略号
];

const wordRegex = /\b[a-zA-Z]+(?:-[a-zA-Z]+)*\b/g;

console.log('测试各种标点符号包围的情况:\n');
testCases.forEach(testCase => {
  const matches = [...testCase.matchAll(wordRegex)];
  console.log(testCase.padEnd(25), '→', matches.map(m => m[0]).join(', ') || '(无匹配)');
});

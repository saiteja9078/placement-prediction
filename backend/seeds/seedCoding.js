const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const CodingQuestion = require('../models/CodingQuestion');

// Helper to create starter code templates
function pyStarter(fnSig, inputParse, outputFmt) {
  return `import sys\n\n${fnSig}\n    # Your solution here\n    pass\n\n${inputParse}\nprint(${outputFmt})`;
}
function jsStarter(inputParse, outputFmt) {
  return `const readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\nlet lines = [];\nrl.on('line', l => lines.push(l));\nrl.on('close', () => {\n    ${inputParse}\n    // Your solution here\n    \n    console.log(${outputFmt});\n});`;
}

const defaultStarter = {
  python: 'import sys\ndata = sys.stdin.read().split()\n# Your solution here\n',
  javascript: 'const readline = require("readline");\nconst rl = readline.createInterface({ input: process.stdin });\nlet lines = [];\nrl.on("line", l => lines.push(l));\nrl.on("close", () => {\n    // Your solution here\n});',
  java: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Your solution here\n    }\n}',
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\nint main() {\n    // Your solution here\n    return 0;\n}'
};

const questions = [
  // ===== EASY (17 questions) =====
  { orderIndex: 1, title: 'Two Sum', difficulty: 'Easy',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.\nEach input has exactly one solution. Return the answer sorted.',
    examples: [{ input: 'nums = [2,7,11,15], target = 9', output: '0 1', explanation: 'nums[0] + nums[1] == 9' }],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '4\n2 7 11 15\n9', expectedOutput: '0 1' }, { input: '3\n3 2 4\n6', expectedOutput: '1 2' }],
    hiddenTestCases: [{ input: '2\n3 3\n6', expectedOutput: '0 1' }, { input: '4\n-1 -2 -3 -4\n-6', expectedOutput: '1 3' }, { input: '5\n1 2 3 4 5\n9', expectedOutput: '3 4' }, { input: '3\n0 4 4\n8', expectedOutput: '1 2' }, { input: '4\n1 2 3 7\n10', expectedOutput: '2 3' }]
  },
  { orderIndex: 2, title: 'Reverse String', difficulty: 'Easy',
    description: 'Given a string s, return the reversed string.',
    examples: [{ input: 's = "hello"', output: 'olleh', explanation: '' }],
    constraints: ['1 <= s.length <= 10^5'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: 'hello', expectedOutput: 'olleh' }, { input: 'world', expectedOutput: 'dlrow' }],
    hiddenTestCases: [{ input: 'a', expectedOutput: 'a' }, { input: 'ab', expectedOutput: 'ba' }, { input: 'racecar', expectedOutput: 'racecar' }, { input: 'abcdef', expectedOutput: 'fedcba' }, { input: 'OpenAI', expectedOutput: 'IAnepO' }]
  },
  { orderIndex: 3, title: 'Palindrome Check', difficulty: 'Easy',
    description: 'Given a string s, determine if it is a palindrome (reads same forward and backward). Output "true" or "false".',
    examples: [{ input: 's = "racecar"', output: 'true', explanation: '' }],
    constraints: ['1 <= s.length <= 10^5'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: 'racecar', expectedOutput: 'true' }, { input: 'hello', expectedOutput: 'false' }],
    hiddenTestCases: [{ input: 'a', expectedOutput: 'true' }, { input: 'ab', expectedOutput: 'false' }, { input: 'abba', expectedOutput: 'true' }, { input: 'madam', expectedOutput: 'true' }, { input: 'test', expectedOutput: 'false' }]
  },
  { orderIndex: 4, title: 'Find Maximum', difficulty: 'Easy',
    description: 'Given an array of n integers, find the maximum element.',
    examples: [{ input: 'n=5, arr=[3,1,4,1,5]', output: '5', explanation: '' }],
    constraints: ['1 <= n <= 10^5'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '5\n3 1 4 1 5', expectedOutput: '5' }, { input: '3\n-1 -5 -2', expectedOutput: '-1' }],
    hiddenTestCases: [{ input: '1\n42', expectedOutput: '42' }, { input: '4\n1 2 3 4', expectedOutput: '4' }, { input: '3\n0 0 0', expectedOutput: '0' }, { input: '5\n-10 -20 -3 -15 -7', expectedOutput: '-3' }, { input: '6\n100 200 50 300 250 150', expectedOutput: '300' }]
  },
  { orderIndex: 5, title: 'Count Vowels', difficulty: 'Easy',
    description: 'Given a string s, count the number of vowels (a,e,i,o,u, case-insensitive).',
    examples: [{ input: 's = "Hello World"', output: '3', explanation: '' }],
    constraints: ['1 <= s.length <= 10^4'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: 'Hello World', expectedOutput: '3' }, { input: 'aeiou', expectedOutput: '5' }],
    hiddenTestCases: [{ input: 'bcdfg', expectedOutput: '0' }, { input: 'AEIOU', expectedOutput: '5' }, { input: 'Programming', expectedOutput: '3' }, { input: 'a', expectedOutput: '1' }, { input: 'xyz', expectedOutput: '0' }]
  },
  { orderIndex: 6, title: 'Factorial', difficulty: 'Easy',
    description: 'Given a non-negative integer n, compute n! (factorial).',
    examples: [{ input: 'n = 5', output: '120', explanation: '5! = 120' }],
    constraints: ['0 <= n <= 20'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '5', expectedOutput: '120' }, { input: '0', expectedOutput: '1' }],
    hiddenTestCases: [{ input: '1', expectedOutput: '1' }, { input: '3', expectedOutput: '6' }, { input: '10', expectedOutput: '3628800' }, { input: '7', expectedOutput: '5040' }, { input: '12', expectedOutput: '479001600' }]
  },
  { orderIndex: 7, title: 'Sum of Array', difficulty: 'Easy',
    description: 'Given an array of n integers, find their sum.',
    examples: [{ input: 'n=4, arr=[1,2,3,4]', output: '10', explanation: '' }],
    constraints: ['1 <= n <= 10^5'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '4\n1 2 3 4', expectedOutput: '10' }, { input: '3\n-1 0 1', expectedOutput: '0' }],
    hiddenTestCases: [{ input: '1\n5', expectedOutput: '5' }, { input: '5\n10 20 30 40 50', expectedOutput: '150' }, { input: '3\n-5 -10 -15', expectedOutput: '-30' }, { input: '2\n1000000 2000000', expectedOutput: '3000000' }, { input: '4\n0 0 0 0', expectedOutput: '0' }]
  },
  { orderIndex: 8, title: 'FizzBuzz Number', difficulty: 'Easy',
    description: 'Given n, print "FizzBuzz" if divisible by both 3 and 5, "Fizz" if by 3, "Buzz" if by 5, else the number itself.',
    examples: [{ input: 'n = 15', output: 'FizzBuzz', explanation: '' }],
    constraints: ['1 <= n <= 10^6'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '15', expectedOutput: 'FizzBuzz' }, { input: '3', expectedOutput: 'Fizz' }],
    hiddenTestCases: [{ input: '5', expectedOutput: 'Buzz' }, { input: '7', expectedOutput: '7' }, { input: '30', expectedOutput: 'FizzBuzz' }, { input: '9', expectedOutput: 'Fizz' }, { input: '1', expectedOutput: '1' }]
  },
  { orderIndex: 9, title: 'Count Digits', difficulty: 'Easy',
    description: 'Given a positive integer n, count how many digits it has.',
    examples: [{ input: 'n = 12345', output: '5', explanation: '' }],
    constraints: ['1 <= n <= 10^18'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '12345', expectedOutput: '5' }, { input: '9', expectedOutput: '1' }],
    hiddenTestCases: [{ input: '100', expectedOutput: '3' }, { input: '1000000', expectedOutput: '7' }, { input: '1', expectedOutput: '1' }, { input: '99', expectedOutput: '2' }, { input: '10', expectedOutput: '2' }]
  },
  { orderIndex: 10, title: 'Check Even or Odd', difficulty: 'Easy',
    description: 'Given an integer n, print "Even" if even, "Odd" if odd.',
    examples: [{ input: 'n = 4', output: 'Even', explanation: '' }],
    constraints: ['-10^9 <= n <= 10^9'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '4', expectedOutput: 'Even' }, { input: '7', expectedOutput: 'Odd' }],
    hiddenTestCases: [{ input: '0', expectedOutput: 'Even' }, { input: '-3', expectedOutput: 'Odd' }, { input: '100', expectedOutput: 'Even' }, { input: '1', expectedOutput: 'Odd' }, { input: '-2', expectedOutput: 'Even' }]
  },
  { orderIndex: 11, title: 'Second Largest', difficulty: 'Easy',
    description: 'Given an array of n distinct integers, find the second largest element.',
    examples: [{ input: 'n=5, arr=[3,1,4,1,5]', output: '4', explanation: '' }],
    constraints: ['2 <= n <= 10^5', 'All elements are distinct'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '5\n3 1 4 2 5', expectedOutput: '4' }, { input: '3\n10 20 30', expectedOutput: '20' }],
    hiddenTestCases: [{ input: '2\n1 2', expectedOutput: '1' }, { input: '4\n-1 -5 -2 -3', expectedOutput: '-2' }, { input: '5\n100 200 50 300 250', expectedOutput: '250' }, { input: '3\n5 3 7', expectedOutput: '5' }, { input: '4\n1 4 2 3', expectedOutput: '3' }]
  },
  { orderIndex: 12, title: 'Power of Two', difficulty: 'Easy',
    description: 'Given a positive integer n, determine if it is a power of 2. Output "true" or "false".',
    examples: [{ input: 'n = 8', output: 'true', explanation: '2^3 = 8' }],
    constraints: ['1 <= n <= 10^9'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '8', expectedOutput: 'true' }, { input: '6', expectedOutput: 'false' }],
    hiddenTestCases: [{ input: '1', expectedOutput: 'true' }, { input: '2', expectedOutput: 'true' }, { input: '1024', expectedOutput: 'true' }, { input: '100', expectedOutput: 'false' }, { input: '16', expectedOutput: 'true' }]
  },
  { orderIndex: 13, title: 'Remove Duplicates', difficulty: 'Easy',
    description: 'Given a sorted array of n integers, print the array with duplicates removed (space-separated).',
    examples: [{ input: 'n=7, arr=[1,1,2,2,3,4,4]', output: '1 2 3 4', explanation: '' }],
    constraints: ['1 <= n <= 10^5'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '7\n1 1 2 2 3 4 4', expectedOutput: '1 2 3 4' }, { input: '5\n1 1 1 1 1', expectedOutput: '1' }],
    hiddenTestCases: [{ input: '1\n5', expectedOutput: '5' }, { input: '3\n1 2 3', expectedOutput: '1 2 3' }, { input: '6\n1 1 2 3 3 3', expectedOutput: '1 2 3' }, { input: '4\n-1 -1 0 0', expectedOutput: '-1 0' }, { input: '5\n10 10 20 20 30', expectedOutput: '10 20 30' }]
  },
  { orderIndex: 14, title: 'GCD of Two Numbers', difficulty: 'Easy',
    description: 'Given two positive integers a and b, find their GCD (Greatest Common Divisor).',
    examples: [{ input: 'a=12, b=8', output: '4', explanation: '' }],
    constraints: ['1 <= a, b <= 10^9'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '12 8', expectedOutput: '4' }, { input: '7 13', expectedOutput: '1' }],
    hiddenTestCases: [{ input: '100 25', expectedOutput: '25' }, { input: '17 17', expectedOutput: '17' }, { input: '1 1000000', expectedOutput: '1' }, { input: '48 36', expectedOutput: '12' }, { input: '21 14', expectedOutput: '7' }]
  },
  { orderIndex: 15, title: 'Fibonacci Number', difficulty: 'Easy',
    description: 'Given n, find the nth Fibonacci number (0-indexed). F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2).',
    examples: [{ input: 'n = 6', output: '8', explanation: 'F(6) = 8' }],
    constraints: ['0 <= n <= 30'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '6', expectedOutput: '8' }, { input: '0', expectedOutput: '0' }],
    hiddenTestCases: [{ input: '1', expectedOutput: '1' }, { input: '10', expectedOutput: '55' }, { input: '20', expectedOutput: '6765' }, { input: '2', expectedOutput: '1' }, { input: '15', expectedOutput: '610' }]
  },
  { orderIndex: 16, title: 'Count Words', difficulty: 'Easy',
    description: 'Given a string of words separated by single spaces, count the number of words.',
    examples: [{ input: '"hello world foo"', output: '3', explanation: '' }],
    constraints: ['1 <= s.length <= 10^4'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: 'hello world foo', expectedOutput: '3' }, { input: 'one', expectedOutput: '1' }],
    hiddenTestCases: [{ input: 'a b c d e', expectedOutput: '5' }, { input: 'the quick brown fox', expectedOutput: '4' }, { input: 'hello', expectedOutput: '1' }, { input: 'one two', expectedOutput: '2' }, { input: 'a b c d e f g h i j', expectedOutput: '10' }]
  },
  { orderIndex: 17, title: 'Array Rotation', difficulty: 'Easy',
    description: 'Given an array of n integers and k, rotate the array to the right by k positions. Print the result space-separated.',
    examples: [{ input: 'n=5, k=2, arr=[1,2,3,4,5]', output: '4 5 1 2 3', explanation: '' }],
    constraints: ['1 <= n <= 10^5', '0 <= k <= 10^5'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '5 2\n1 2 3 4 5', expectedOutput: '4 5 1 2 3' }, { input: '3 1\n1 2 3', expectedOutput: '3 1 2' }],
    hiddenTestCases: [{ input: '4 0\n1 2 3 4', expectedOutput: '1 2 3 4' }, { input: '4 4\n1 2 3 4', expectedOutput: '1 2 3 4' }, { input: '1 5\n42', expectedOutput: '42' }, { input: '5 3\n10 20 30 40 50', expectedOutput: '30 40 50 10 20' }, { input: '3 2\n7 8 9', expectedOutput: '8 9 7' }]
  },

  // ===== MEDIUM (17 questions) =====
  { orderIndex: 18, title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium',
    description: 'Given a string s, find the length of the longest substring without repeating characters.',
    examples: [{ input: 's = "abcabcbb"', output: '3', explanation: '"abc" has length 3' }],
    constraints: ['0 <= s.length <= 5 * 10^4'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: 'abcabcbb', expectedOutput: '3' }, { input: 'bbbbb', expectedOutput: '1' }],
    hiddenTestCases: [{ input: 'pwwkew', expectedOutput: '3' }, { input: '', expectedOutput: '0' }, { input: 'au', expectedOutput: '2' }, { input: 'dvdf', expectedOutput: '3' }, { input: 'abcdefg', expectedOutput: '7' }]
  },
  { orderIndex: 19, title: 'Valid Parentheses', difficulty: 'Medium',
    description: 'Given a string containing just "(", ")", "{", "}", "[", "]", determine if the input string is valid. Output "true" or "false".',
    examples: [{ input: 's = "()[]{}"', output: 'true', explanation: '' }],
    constraints: ['1 <= s.length <= 10^4'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '()[]{}', expectedOutput: 'true' }, { input: '(]', expectedOutput: 'false' }],
    hiddenTestCases: [{ input: '()', expectedOutput: 'true' }, { input: '([)]', expectedOutput: 'false' }, { input: '{[]}', expectedOutput: 'true' }, { input: '(', expectedOutput: 'false' }, { input: '([]{})', expectedOutput: 'true' }]
  },
  { orderIndex: 20, title: 'Merge Two Sorted Arrays', difficulty: 'Medium',
    description: 'Given two sorted arrays, merge them into one sorted array. Print space-separated.',
    examples: [{ input: 'a=[1,3,5] b=[2,4,6]', output: '1 2 3 4 5 6', explanation: '' }],
    constraints: ['0 <= n, m <= 10^5'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '3\n1 3 5\n3\n2 4 6', expectedOutput: '1 2 3 4 5 6' }, { input: '2\n1 2\n3\n3 4 5', expectedOutput: '1 2 3 4 5' }],
    hiddenTestCases: [{ input: '0\n\n3\n1 2 3', expectedOutput: '1 2 3' }, { input: '1\n5\n1\n3', expectedOutput: '3 5' }, { input: '3\n1 1 1\n3\n1 1 1', expectedOutput: '1 1 1 1 1 1' }, { input: '4\n-3 -1 2 4\n3\n-2 0 3', expectedOutput: '-3 -2 -1 0 2 3 4' }, { input: '2\n10 20\n2\n15 25', expectedOutput: '10 15 20 25' }]
  },
  { orderIndex: 21, title: 'Binary Search', difficulty: 'Medium',
    description: 'Given a sorted array and a target, return the index of target or -1 if not found.',
    examples: [{ input: 'arr=[1,3,5,7,9], target=5', output: '2', explanation: '' }],
    constraints: ['1 <= n <= 10^5'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '5\n1 3 5 7 9\n5', expectedOutput: '2' }, { input: '3\n1 2 3\n4', expectedOutput: '-1' }],
    hiddenTestCases: [{ input: '1\n5\n5', expectedOutput: '0' }, { input: '5\n1 2 3 4 5\n1', expectedOutput: '0' }, { input: '5\n1 2 3 4 5\n5', expectedOutput: '4' }, { input: '4\n10 20 30 40\n25', expectedOutput: '-1' }, { input: '6\n-5 -3 0 2 4 6\n-3', expectedOutput: '1' }]
  },
  { orderIndex: 22, title: 'Anagram Check', difficulty: 'Medium',
    description: 'Given two strings s and t, determine if t is an anagram of s. Output "true" or "false".',
    examples: [{ input: 's="anagram" t="nagaram"', output: 'true', explanation: '' }],
    constraints: ['1 <= s.length, t.length <= 5 * 10^4'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: 'anagram\nnagaram', expectedOutput: 'true' }, { input: 'rat\ncar', expectedOutput: 'false' }],
    hiddenTestCases: [{ input: 'a\na', expectedOutput: 'true' }, { input: 'ab\nba', expectedOutput: 'true' }, { input: 'abc\nabd', expectedOutput: 'false' }, { input: 'listen\nsilent', expectedOutput: 'true' }, { input: 'hello\nworld', expectedOutput: 'false' }]
  },
  { orderIndex: 23, title: 'Majority Element', difficulty: 'Medium',
    description: 'Given an array of n elements, find the element that appears more than n/2 times.',
    examples: [{ input: 'arr=[3,2,3]', output: '3', explanation: '' }],
    constraints: ['1 <= n <= 10^5', 'Majority element always exists'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '3\n3 2 3', expectedOutput: '3' }, { input: '7\n2 2 1 1 1 2 2', expectedOutput: '2' }],
    hiddenTestCases: [{ input: '1\n5', expectedOutput: '5' }, { input: '5\n1 1 1 2 3', expectedOutput: '1' }, { input: '3\n1 1 1', expectedOutput: '1' }, { input: '9\n4 4 4 4 4 1 2 3 5', expectedOutput: '4' }, { input: '5\n7 7 7 3 3', expectedOutput: '7' }]
  },
  { orderIndex: 24, title: 'Product of Array Except Self', difficulty: 'Medium',
    description: 'Given an array of n integers, return an array where each element is the product of all other elements. Print space-separated.',
    examples: [{ input: 'arr=[1,2,3,4]', output: '24 12 8 6', explanation: '' }],
    constraints: ['2 <= n <= 10^5'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '4\n1 2 3 4', expectedOutput: '24 12 8 6' }, { input: '3\n2 3 4', expectedOutput: '12 8 6' }],
    hiddenTestCases: [{ input: '2\n5 3', expectedOutput: '3 5' }, { input: '5\n1 1 1 1 1', expectedOutput: '1 1 1 1 1' }, { input: '4\n-1 1 0 -3', expectedOutput: '0 0 3 0' }, { input: '3\n2 2 2', expectedOutput: '4 4 4' }, { input: '4\n1 2 0 4', expectedOutput: '0 0 8 0' }]
  },
  { orderIndex: 25, title: 'Matrix Transpose', difficulty: 'Medium',
    description: 'Given an n×m matrix, print its transpose. Each row on a new line, space-separated.',
    examples: [{ input: '2×3 matrix [[1,2,3],[4,5,6]]', output: '1 4\n2 5\n3 6', explanation: '' }],
    constraints: ['1 <= n, m <= 100'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '2 3\n1 2 3\n4 5 6', expectedOutput: '1 4\n2 5\n3 6' }],
    hiddenTestCases: [{ input: '1 1\n5', expectedOutput: '5' }, { input: '3 3\n1 2 3\n4 5 6\n7 8 9', expectedOutput: '1 4 7\n2 5 8\n3 6 9' }, { input: '1 3\n1 2 3', expectedOutput: '1\n2\n3' }, { input: '2 2\n0 1\n1 0', expectedOutput: '0 1\n1 0' }]
  },
  { orderIndex: 26, title: 'String Compression', difficulty: 'Medium',
    description: 'Given a string, compress it by counting consecutive characters. E.g. "aabcccccaaa" → "a2b1c5a3". If compressed is not shorter, return original.',
    examples: [{ input: 's = "aabcccccaaa"', output: 'a2b1c5a3', explanation: '' }],
    constraints: ['1 <= s.length <= 10^5'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: 'aabcccccaaa', expectedOutput: 'a2b1c5a3' }, { input: 'abc', expectedOutput: 'abc' }],
    hiddenTestCases: [{ input: 'aaa', expectedOutput: 'a3' }, { input: 'a', expectedOutput: 'a' }, { input: 'aaabbbccc', expectedOutput: 'a3b3c3' }, { input: 'aabb', expectedOutput: 'aabb' }, { input: 'aaaaa', expectedOutput: 'a5' }]
  },
  { orderIndex: 27, title: 'Kadane Maximum Subarray', difficulty: 'Medium',
    description: 'Given an array of integers, find the contiguous subarray with the largest sum.',
    examples: [{ input: 'arr=[-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: '[4,-1,2,1] has sum 6' }],
    constraints: ['1 <= n <= 10^5'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '9\n-2 1 -3 4 -1 2 1 -5 4', expectedOutput: '6' }, { input: '1\n-1', expectedOutput: '-1' }],
    hiddenTestCases: [{ input: '5\n1 2 3 4 5', expectedOutput: '15' }, { input: '3\n-1 -2 -3', expectedOutput: '-1' }, { input: '4\n-2 1 -1 3', expectedOutput: '3' }, { input: '6\n2 -1 2 3 4 -5', expectedOutput: '10' }, { input: '3\n5 -3 5', expectedOutput: '7' }]
  },
  { orderIndex: 28, title: 'Sort Colors (Dutch Flag)', difficulty: 'Medium',
    description: 'Given an array with values 0, 1, and 2, sort it in-place. Print space-separated.',
    examples: [{ input: 'arr=[2,0,2,1,1,0]', output: '0 0 1 1 2 2', explanation: '' }],
    constraints: ['1 <= n <= 300'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '6\n2 0 2 1 1 0', expectedOutput: '0 0 1 1 2 2' }, { input: '3\n2 0 1', expectedOutput: '0 1 2' }],
    hiddenTestCases: [{ input: '1\n0', expectedOutput: '0' }, { input: '5\n0 0 0 0 0', expectedOutput: '0 0 0 0 0' }, { input: '3\n1 1 1', expectedOutput: '1 1 1' }, { input: '4\n2 2 1 0', expectedOutput: '0 1 2 2' }, { input: '7\n1 0 2 1 0 2 1', expectedOutput: '0 0 1 1 1 2 2' }]
  },
  { orderIndex: 29, title: 'Prime Sieve', difficulty: 'Medium',
    description: 'Given n, print all prime numbers less than or equal to n, space-separated.',
    examples: [{ input: 'n = 10', output: '2 3 5 7', explanation: '' }],
    constraints: ['2 <= n <= 10^6'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '10', expectedOutput: '2 3 5 7' }, { input: '2', expectedOutput: '2' }],
    hiddenTestCases: [{ input: '20', expectedOutput: '2 3 5 7 11 13 17 19' }, { input: '3', expectedOutput: '2 3' }, { input: '30', expectedOutput: '2 3 5 7 11 13 17 19 23 29' }, { input: '5', expectedOutput: '2 3 5' }, { input: '1', expectedOutput: '' }]
  },
  { orderIndex: 30, title: 'Spiral Matrix Print', difficulty: 'Medium',
    description: 'Given an n×n matrix, print elements in spiral order (clockwise), space-separated.',
    examples: [{ input: '3×3 [[1,2,3],[4,5,6],[7,8,9]]', output: '1 2 3 6 9 8 7 4 5', explanation: '' }],
    constraints: ['1 <= n <= 100'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '3\n1 2 3\n4 5 6\n7 8 9', expectedOutput: '1 2 3 6 9 8 7 4 5' }],
    hiddenTestCases: [{ input: '1\n1', expectedOutput: '1' }, { input: '2\n1 2\n3 4', expectedOutput: '1 2 4 3' }, { input: '4\n1 2 3 4\n5 6 7 8\n9 10 11 12\n13 14 15 16', expectedOutput: '1 2 3 4 8 12 16 15 14 13 9 5 6 7 11 10' }]
  },
  { orderIndex: 31, title: 'Linked List Middle', difficulty: 'Medium',
    description: 'Given n elements of a singly linked list, find the middle element. If two middles, return the second.',
    examples: [{ input: 'list = [1,2,3,4,5]', output: '3', explanation: '' }],
    constraints: ['1 <= n <= 10^5'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '5\n1 2 3 4 5', expectedOutput: '3' }, { input: '6\n1 2 3 4 5 6', expectedOutput: '4' }],
    hiddenTestCases: [{ input: '1\n1', expectedOutput: '1' }, { input: '2\n1 2', expectedOutput: '2' }, { input: '7\n10 20 30 40 50 60 70', expectedOutput: '40' }, { input: '4\n5 10 15 20', expectedOutput: '15' }, { input: '3\n100 200 300', expectedOutput: '200' }]
  },

  // ===== HARD (16 questions) =====
  { orderIndex: 35, title: 'Coin Change', difficulty: 'Hard',
    description: 'Given coin denominations and an amount, return the fewest coins needed. Return -1 if impossible.',
    examples: [{ input: 'coins=[1,5,11], amount=15', output: '3', explanation: '15 = 5+5+5' }],
    constraints: ['1 <= coins.length <= 12', '0 <= amount <= 10^4'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '3\n1 5 11\n15', expectedOutput: '3' }, { input: '1\n2\n3', expectedOutput: '-1' }],
    hiddenTestCases: [{ input: '1\n1\n0', expectedOutput: '0' }, { input: '3\n1 2 5\n11', expectedOutput: '3' }, { input: '2\n3 5\n7', expectedOutput: '-1' }, { input: '3\n1 3 4\n6', expectedOutput: '2' }, { input: '4\n1 5 10 25\n30', expectedOutput: '2' }]
  },
  { orderIndex: 36, title: 'Longest Common Subsequence', difficulty: 'Hard',
    description: 'Given two strings, find the length of their longest common subsequence.',
    examples: [{ input: 's1="abcde" s2="ace"', output: '3', explanation: 'LCS is "ace"' }],
    constraints: ['1 <= s1.length, s2.length <= 1000'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: 'abcde\nace', expectedOutput: '3' }, { input: 'abc\nabc', expectedOutput: '3' }],
    hiddenTestCases: [{ input: 'abc\ndef', expectedOutput: '0' }, { input: 'abcba\nabcbcba', expectedOutput: '5' }, { input: 'a\na', expectedOutput: '1' }, { input: 'abcd\ndcba', expectedOutput: '1' }, { input: 'aggtab\ngxtxayb', expectedOutput: '4' }]
  },
  { orderIndex: 37, title: 'N-Queens Count', difficulty: 'Hard',
    description: 'Given n, find the number of distinct solutions to the N-Queens problem.',
    examples: [{ input: 'n = 4', output: '2', explanation: '' }],
    constraints: ['1 <= n <= 12'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '4', expectedOutput: '2' }, { input: '1', expectedOutput: '1' }],
    hiddenTestCases: [{ input: '5', expectedOutput: '10' }, { input: '6', expectedOutput: '4' }, { input: '8', expectedOutput: '92' }, { input: '2', expectedOutput: '0' }, { input: '3', expectedOutput: '0' }]
  },
  { orderIndex: 38, title: '0/1 Knapsack', difficulty: 'Hard',
    description: 'Given n items with weights and values, and capacity W, find maximum value achievable.',
    examples: [{ input: 'W=50, items=[(60,10),(100,20),(120,30)]', output: '220', explanation: '' }],
    constraints: ['1 <= n <= 100', '1 <= W <= 1000'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '3 50\n60 10\n100 20\n120 30', expectedOutput: '220' }],
    hiddenTestCases: [{ input: '4 7\n1 1\n4 3\n5 4\n7 5', expectedOutput: '9' }, { input: '1 10\n100 5', expectedOutput: '100' }, { input: '3 10\n60 5\n50 3\n70 4', expectedOutput: '120' }, { input: '2 3\n10 5\n20 6', expectedOutput: '0' }]
  },
  { orderIndex: 39, title: 'Longest Increasing Subsequence', difficulty: 'Hard',
    description: 'Given an array of integers, find the length of the longest strictly increasing subsequence.',
    examples: [{ input: 'arr=[10,9,2,5,3,7,101,18]', output: '4', explanation: '[2,3,7,101]' }],
    constraints: ['1 <= n <= 2500'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '8\n10 9 2 5 3 7 101 18', expectedOutput: '4' }, { input: '4\n0 1 0 3', expectedOutput: '3' }],
    hiddenTestCases: [{ input: '1\n5', expectedOutput: '1' }, { input: '5\n5 4 3 2 1', expectedOutput: '1' }, { input: '6\n1 2 3 4 5 6', expectedOutput: '6' }, { input: '7\n7 7 7 7 7 7 7', expectedOutput: '1' }, { input: '5\n3 1 4 1 5', expectedOutput: '3' }]
  },
  { orderIndex: 40, title: 'Word Break', difficulty: 'Hard',
    description: 'Given a string s and a dictionary of words, determine if s can be segmented into dictionary words. Output "true" or "false".',
    examples: [{ input: 's="leetcode" dict=["leet","code"]', output: 'true', explanation: '' }],
    constraints: ['1 <= s.length <= 300'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: 'leetcode\n2\nleet code', expectedOutput: 'true' }, { input: 'catsandog\n5\ncats dog sand and cat', expectedOutput: 'false' }],
    hiddenTestCases: [{ input: 'applepenapple\n2\napple pen', expectedOutput: 'true' }, { input: 'a\n1\na', expectedOutput: 'true' }, { input: 'abc\n3\na b c', expectedOutput: 'true' }, { input: 'cars\n2\ncar ca', expectedOutput: 'false' }, { input: 'aaaaaaa\n2\naaa aaaa', expectedOutput: 'true' }]
  },
  { orderIndex: 41, title: 'Edit Distance', difficulty: 'Hard',
    description: 'Given two strings, find the minimum number of operations (insert, delete, replace) to convert one to the other.',
    examples: [{ input: 's1="horse" s2="ros"', output: '3', explanation: '' }],
    constraints: ['0 <= s1.length, s2.length <= 500'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: 'horse\nros', expectedOutput: '3' }, { input: 'intention\nexecution', expectedOutput: '5' }],
    hiddenTestCases: [{ input: '\n\n', expectedOutput: '0' }, { input: 'abc\nabc', expectedOutput: '0' }, { input: 'abc\n', expectedOutput: '3' }, { input: '\nabc', expectedOutput: '3' }, { input: 'kitten\nsitting', expectedOutput: '3' }]
  },
  { orderIndex: 42, title: 'Merge Intervals', difficulty: 'Hard',
    description: 'Given a collection of intervals, merge all overlapping intervals. Print each interval on a new line as "start end".',
    examples: [{ input: '[[1,3],[2,6],[8,10],[15,18]]', output: '1 6\n8 10\n15 18', explanation: '' }],
    constraints: ['1 <= intervals.length <= 10^4'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '4\n1 3\n2 6\n8 10\n15 18', expectedOutput: '1 6\n8 10\n15 18' }, { input: '2\n1 4\n4 5', expectedOutput: '1 5' }],
    hiddenTestCases: [{ input: '1\n1 5', expectedOutput: '1 5' }, { input: '3\n1 10\n2 6\n8 9', expectedOutput: '1 10' }, { input: '3\n1 2\n3 4\n5 6', expectedOutput: '1 2\n3 4\n5 6' }, { input: '4\n1 4\n0 4\n3 5\n7 9', expectedOutput: '0 5\n7 9' }]
  },
  { orderIndex: 43, title: 'Trapping Rain Water', difficulty: 'Hard',
    description: 'Given n non-negative integers representing an elevation map, compute how much water can be trapped.',
    examples: [{ input: 'height=[0,1,0,2,1,0,1,3,2,1,2,1]', output: '6', explanation: '' }],
    constraints: ['1 <= n <= 2 * 10^4'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '12\n0 1 0 2 1 0 1 3 2 1 2 1', expectedOutput: '6' }, { input: '6\n4 2 0 3 2 5', expectedOutput: '9' }],
    hiddenTestCases: [{ input: '1\n5', expectedOutput: '0' }, { input: '3\n3 0 3', expectedOutput: '3' }, { input: '5\n1 2 3 4 5', expectedOutput: '0' }, { input: '5\n5 4 3 2 1', expectedOutput: '0' }, { input: '6\n3 0 2 0 4 0', expectedOutput: '7' }]
  },
  { orderIndex: 44, title: 'Longest Palindromic Substring Length', difficulty: 'Hard',
    description: 'Given a string s, return the length of the longest palindromic substring.',
    examples: [{ input: 's = "babad"', output: '3', explanation: '"bab" or "aba"' }],
    constraints: ['1 <= s.length <= 1000'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: 'babad', expectedOutput: '3' }, { input: 'cbbd', expectedOutput: '2' }],
    hiddenTestCases: [{ input: 'a', expectedOutput: '1' }, { input: 'ac', expectedOutput: '1' }, { input: 'racecar', expectedOutput: '7' }, { input: 'aaa', expectedOutput: '3' }, { input: 'abcba', expectedOutput: '5' }]
  },
  { orderIndex: 45, title: 'Minimum Path Sum', difficulty: 'Hard',
    description: 'Given an m×n grid of non-negative integers, find the minimum sum path from top-left to bottom-right. Can only move right or down.',
    examples: [{ input: '[[1,3,1],[1,5,1],[4,2,1]]', output: '7', explanation: '1→3→1→1→1=7' }],
    constraints: ['1 <= m, n <= 200'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '3 3\n1 3 1\n1 5 1\n4 2 1', expectedOutput: '7' }],
    hiddenTestCases: [{ input: '1 1\n5', expectedOutput: '5' }, { input: '2 3\n1 2 3\n4 5 6', expectedOutput: '12' }, { input: '2 2\n1 2\n1 1', expectedOutput: '3' }, { input: '3 3\n1 1 1\n1 1 1\n1 1 1', expectedOutput: '5' }]
  },
  { orderIndex: 46, title: 'Count Inversions', difficulty: 'Hard',
    description: 'Given an array of n integers, count the number of inversions (pairs where i < j but arr[i] > arr[j]).',
    examples: [{ input: 'arr=[2,4,1,3,5]', output: '3', explanation: '(2,1),(4,1),(4,3)' }],
    constraints: ['1 <= n <= 10^5'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '5\n2 4 1 3 5', expectedOutput: '3' }, { input: '5\n5 4 3 2 1', expectedOutput: '10' }],
    hiddenTestCases: [{ input: '1\n1', expectedOutput: '0' }, { input: '5\n1 2 3 4 5', expectedOutput: '0' }, { input: '3\n3 1 2', expectedOutput: '2' }, { input: '4\n1 5 2 4', expectedOutput: '2' }, { input: '6\n6 5 4 3 2 1', expectedOutput: '15' }]
  },
  { orderIndex: 47, title: 'Subset Sum', difficulty: 'Hard',
    description: 'Given an array of positive integers and a target sum, determine if any subset sums to target. Output "true" or "false".',
    examples: [{ input: 'arr=[3,34,4,12,5,2] sum=9', output: 'true', explanation: '4+5=9' }],
    constraints: ['1 <= n <= 200', '1 <= sum <= 10^4'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '6 9\n3 34 4 12 5 2', expectedOutput: 'true' }, { input: '3 30\n3 4 5', expectedOutput: 'false' }],
    hiddenTestCases: [{ input: '1 5\n5', expectedOutput: 'true' }, { input: '1 3\n5', expectedOutput: 'false' }, { input: '4 10\n2 3 7 8', expectedOutput: 'true' }, { input: '3 6\n1 2 3', expectedOutput: 'true' }, { input: '5 100\n1 2 3 4 5', expectedOutput: 'false' }]
  },
  { orderIndex: 48, title: 'Median of Two Sorted Arrays', difficulty: 'Hard',
    description: 'Given two sorted arrays, find the median of the merged array. Output with one decimal if even length.',
    examples: [{ input: 'a=[1,3] b=[2]', output: '2.0', explanation: 'Merged=[1,2,3], median=2.0' }],
    constraints: ['0 <= n, m <= 10^5', 'n + m >= 1'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '2\n1 3\n1\n2', expectedOutput: '2.0' }, { input: '2\n1 2\n2\n3 4', expectedOutput: '2.5' }],
    hiddenTestCases: [{ input: '0\n\n1\n5', expectedOutput: '5.0' }, { input: '1\n1\n1\n2', expectedOutput: '1.5' }, { input: '3\n1 2 3\n3\n4 5 6', expectedOutput: '3.5' }, { input: '1\n2\n0\n', expectedOutput: '2.0' }]
  },
  { orderIndex: 49, title: 'Topological Sort', difficulty: 'Hard',
    description: 'Given a DAG with n nodes and m edges, print a valid topological ordering. Nodes are 0-indexed.',
    examples: [{ input: 'n=4, edges=[(0,1),(0,2),(1,3),(2,3)]', output: '0 1 2 3', explanation: '' }],
    constraints: ['1 <= n <= 10^4'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '4 4\n0 1\n0 2\n1 3\n2 3', expectedOutput: '0 1 2 3' }, { input: '2 1\n0 1', expectedOutput: '0 1' }],
    hiddenTestCases: [{ input: '1 0', expectedOutput: '0' }, { input: '3 2\n0 1\n1 2', expectedOutput: '0 1 2' }, { input: '4 3\n0 1\n0 2\n0 3', expectedOutput: '0 1 2 3' }]
  },
  { orderIndex: 50, title: 'Max Profit with Cooldown', difficulty: 'Hard',
    description: 'Given array of stock prices, find max profit with as many transactions as you like. After selling, must wait one day before buying again.',
    examples: [{ input: 'prices=[1,2,3,0,2]', output: '3', explanation: 'buy,sell,cooldown,buy,sell' }],
    constraints: ['1 <= n <= 5000'],
    starterCode: defaultStarter,
    publicTestCases: [{ input: '5\n1 2 3 0 2', expectedOutput: '3' }, { input: '1\n1', expectedOutput: '0' }],
    hiddenTestCases: [{ input: '4\n1 2 4 2', expectedOutput: '3' }, { input: '3\n3 2 1', expectedOutput: '0' }, { input: '6\n1 2 3 4 5 6', expectedOutput: '5' }, { input: '5\n2 1 4 5 2', expectedOutput: '4' }, { input: '4\n1 4 2 7', expectedOutput: '8' }]
  }
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  await CodingQuestion.deleteMany({});
  await CodingQuestion.insertMany(questions);
  console.log(`Seeded ${questions.length} coding questions (Easy: ${questions.filter(q=>q.difficulty==='Easy').length}, Medium: ${questions.filter(q=>q.difficulty==='Medium').length}, Hard: ${questions.filter(q=>q.difficulty==='Hard').length})`);
  await mongoose.disconnect();
}

if (require.main === module) {
  seed().catch(console.error);
}

module.exports = { seed, questions };

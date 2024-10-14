// // // const fs = require('fs');
// // // fs.readFile('data.txt', 'utf8', (err, data) => {
// // //   if (err) throw err;
// // //   console.log(data);
// // // });
// // console.log('Before setImmediate');
// // setImmediate(() => {
// //   console.log('Inside setImmediate');
// // });
// // console.log('After setImmediate');

// // const arr = [1, 2, 3, 4, 5];
// // arr.splice(2, 2);  // Removes element at index 2
// // console.log(arr);  // Output: [1, 2, 4, 5]

// // const numbers = [1, -2, 3, -4, 5];
// // const sum = numbers.reduce((acc, num) => num > 0 ? acc + num : acc, 0);
// // console.log(sum);  // Output: 9


// //   const a='hello';
// //   const b=a.charAt(0).toUpperCase()+a.slice(1)
// //   console.log(b)
  

// const digits = [0, 1, 2, 3, 4, 5, 6, 7];
// const missing = [...Array(10).keys()].filter(digit => !digits.includes(digit));
// console.log(missing);  // Output: [8, 9]

// const original = {
//     name: 'Alice',
//     address: {
//       city: 'New York',
//       zip: '10001'
//     }
//   };
  
//   const shallowCopy = { ...original };  // Shallow copy using spread operator
  
//   shallowCopy.name = 'Los Angeles';  // Modify the nested object
  
//   console.log(original.name);  // Output: 'Los Angeles' (The original is also affected)
  

// const original = { name: 'Alice', age: 25 };
// const shallowCopy = Object.assign({}, original);

// shallowCopy.age = 'Los Angeles'; 
// console.log(original.age)
// console.log(shallowCopy.age)

// let p1 = Promise.resolve("First");
// let p2 = Promise.reject("Second");
// let p3 = Promise.resolve("Second");

// Promise.all([p1, p2,p3]).then(values => {
//   console.log(values); // Output: ["First", "Second"]
// });
// let p1 = Promise.resolve("First");
// let p2 = Promise.reject("Second");
// let p3 = Promise.resolve("Second");

// Promise.all([p1, p2,p3])
// .then(values => {
//   console.log(values); // Output: ["First", "Second"]


// }).catch(err=>{console.log('error')})

// const arr = [5, 8, 2, 7, 1,1];
// const sorted = arr.sort((a, b) => b-a);

// console.log(sorted);  // Output: 2

const obj = { a: 1, b: 2, c: 3 };
function removeLastProperty(obj) {
  const keys = Object.entries(obj).pop();
  delete keys.pop()
    
}
removeLastProperty(obj);
console.log(obj); // { a: 1, b: 2 }





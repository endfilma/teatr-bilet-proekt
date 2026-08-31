UPDATE halls SET layout = '{"blocks":[
  {"id":"left","label":"Партер, левый блок","position":"left","priceMultiplier":1.2,"rows":6,"seatsPerRow":5,"aisleAfter":[],"rowGapAfter":[]},
  {"id":"right","label":"Партер, правый блок","position":"right","priceMultiplier":1.2,"rows":6,"seatsPerRow":5,"aisleAfter":[],"rowGapAfter":[]},
  {"id":"front","label":"Задние ряды","position":"front","priceMultiplier":1,"rows":4,"seatsPerRow":10,"aisleAfter":[5],"rowGapAfter":[2]}
]}'::jsonb WHERE name = 'Большой зал';

UPDATE halls SET layout = '{"blocks":[
  {"id":"left","label":"Партер, левый блок","position":"left","priceMultiplier":1.2,"rows":4,"seatsPerRow":4,"aisleAfter":[],"rowGapAfter":[]},
  {"id":"right","label":"Партер, правый блок","position":"right","priceMultiplier":1.2,"rows":4,"seatsPerRow":4,"aisleAfter":[],"rowGapAfter":[]},
  {"id":"front","label":"Задние ряды","position":"front","priceMultiplier":1,"rows":2,"seatsPerRow":9,"aisleAfter":[4],"rowGapAfter":[]}
]}'::jsonb WHERE name = 'Малый зал';

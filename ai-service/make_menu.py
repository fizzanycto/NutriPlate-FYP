import json
P = {"p1":"Gujrat Desi Kitchen","p2":"Green Bowl Cafe","p3":"Sehat Cloud Kitchen","p4":"City Hospital Cafeteria","p5":"Lahori Tadka"}
# id, provider, name, desc, kcal, carbs, sugar, sodium, protein, sat_fat, potassium, phosphorus, fiber, allergens, tags, price
rows = [
("m1","p1","Chicken Karahi","Chicken cooked in tomato, ginger and spices, oily",520,12,5,980,38,9,620,330,2,[],["non-veg","spicy"],900),
("m2","p1","Daal Chawal","Lentil curry with steamed rice, light and homely",430,70,3,420,16,2,480,260,8,[],["vegetarian","light"],350),
("m3","p1","Mixed Sabzi with Roti","Seasonal vegetables with one whole wheat roti",320,48,6,380,9,2,520,190,9,[],["vegetarian","light","high-fibre"],300),
("m4","p1","Beef Nihari","Slow cooked beef stew, rich and heavy",680,20,4,1250,42,14,700,380,2,["gluten"],["non-veg","heavy"],1100),
("m5","p1","Gajar Halwa","Carrot dessert with sugar, milk and ghee",410,55,42,90,6,11,350,150,3,["milk"],["dessert","sweet","vegetarian"],400),
("m6","p2","Grilled Chicken Salad","Grilled chicken breast with greens and lemon dressing",290,14,5,360,32,2,540,240,5,[],["non-veg","light","high-protein"],650),
("m7","p2","Quinoa Veggie Bowl","Quinoa, chickpeas, cucumber and olive oil",360,46,4,280,13,2,510,230,9,[],["vegetarian","high-fibre","light"],700),
("m8","p2","Oats Porridge","Oats cooked in water with cinnamon, no sugar added",210,34,1,60,7,1,230,170,6,["gluten"],["vegetarian","breakfast","light","high-fibre"],300),
("m9","p2","Peanut Butter Smoothie","Banana, peanut butter and milk",420,52,32,150,14,5,780,260,5,["peanuts","milk"],["vegetarian","breakfast","sweet"],500),
("m10","p2","Clear Vegetable Soup","Light clear soup with carrot, beans and cabbage",110,18,6,310,4,0,330,90,4,[],["vegetarian","light","soup"],250),
("m11","p3","Steamed Fish with Vegetables","Steamed fillet with zucchini and carrot, no oil",300,10,4,330,34,1,520,280,3,["fish"],["non-veg","light","high-protein"],850),
("m12","p3","Boiled Egg Whites Plate","Four egg whites with cucumber and one slice of brown bread",190,16,3,260,22,0,210,60,3,["eggs","gluten"],["breakfast","light","high-protein"],300),
("m13","p3","Low Salt Chicken Soup","Homemade chicken soup without added salt",160,9,2,210,18,1,300,140,2,[],["non-veg","light","soup"],400),
("m14","p3","Brown Rice Khichdi","Rice and moong daal khichdi, mild and soft",340,58,2,240,12,2,400,200,6,[],["vegetarian","light","soft"],320),
("m15","p3","Apple Cinnamon Bowl","Chopped apple with yogurt and cinnamon",180,30,22,60,6,2,300,120,4,["milk"],["vegetarian","sweet","breakfast"],280),
("m16","p4","Hospital Plain Roti Sabzi","Plain roti with boiled vegetables",300,50,5,300,8,1,450,170,7,[],["vegetarian","light"],200),
("m17","p4","Soft Dalia","Broken wheat porridge with milk",260,40,8,90,9,3,260,180,5,["gluten","milk"],["vegetarian","breakfast","soft"],180),
("m18","p4","Boiled Chicken with Rice","Plain boiled chicken with white rice",410,52,1,320,30,2,420,250,1,[],["non-veg","light","soft"],380),
("m19","p4","Yogurt Raita Bowl","Plain low fat yogurt with cucumber",120,10,8,110,7,2,290,160,1,["milk"],["vegetarian","light"],150),
("m20","p4","Vegetable Pulao","Rice cooked with mixed vegetables",380,64,4,520,8,3,380,170,4,[],["vegetarian"],320),
("m21","p5","Chicken Biryani","Spiced rice and chicken, oily and salty",720,85,5,1320,34,12,650,340,3,[],["non-veg","spicy","heavy"],550),
("m22","p5","Aloo Samosa (2 pcs)","Deep fried potato pastry",360,42,3,610,6,7,410,90,3,["gluten"],["vegetarian","fried","snack"],120),
("m23","p5","Chicken Tikka (4 pcs)","Grilled marinated chicken pieces",310,6,3,720,34,5,440,260,1,["milk"],["non-veg","grilled","high-protein"],600),
("m24","p5","Fresh Fruit Chaat","Seasonal fruit, no added sugar",150,36,28,20,2,0,520,60,4,[],["vegetarian","sweet","snack"],250),
("m25","p5","Kheer","Rice pudding with sugar and milk",330,52,38,100,7,6,300,200,1,["milk"],["dessert","sweet","vegetarian"],220),
("m26","p3","Zucchini Lentil Stew","Soft zucchini cooked with masoor daal",240,32,5,230,13,1,430,210,8,[],["vegetarian","light","high-fibre"],380),
("m27","p2","Boiled Corn Cup","Steamed corn with lemon, no butter",140,30,5,25,4,1,300,110,4,[],["vegetarian","snack","light"],180),
("m28","p4","Egg Omelette with Toast","Two egg omelette with brown toast",330,18,3,480,18,6,240,230,3,["eggs","gluten"],["breakfast"],250),
]
keys = "id provider_id name description calories carbs_g sugar_g sodium_mg protein_g sat_fat_g potassium_mg phosphorus_mg fiber_g allergens tags price".split()
items = [dict(zip(keys,r)) for r in rows]
for i in items: i["provider_name"]=P[i["provider_id"]]
json.dump({"providers":[{"id":k,"name":v} for k,v in P.items()],"items":items}, open("app/data/menu.json","w"), indent=2)
print(len(items),"items")

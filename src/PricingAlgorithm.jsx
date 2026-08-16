const distance = 400; // km
const fuelefficiency = 12; // liters/100 km
const fuelCostPerLiter = 800; // ₦ per liter

// Calculate the total fuel needed
const totalFuelNeeded = (distance / 100) * fuelefficiency;

// Calculate the total fuel cost
const totalFuelCost = totalFuelNeeded * fuelCostPerLiter;

const numberOfSeats = 3; // assuming the car has 4 seats, 3 passengers
const discountPercentage = 0.30; // 30% discount

// Calculate the cost per passenger
const costPerPassenger = totalFuelCost / numberOfSeats;

// Calculate the discounted price per passenger
const discountedPricePerPassenger = costPerPassenger * (1 - discountPercentage);

console.log(`Discounted Price per Passenger: ₦${discountedPricePerPassenger.toFixed(2)}`);

const getClimateFactor = require("./weatherService");

async function estimateUsage({ numberOfPeople, location }) {

    const baseline = 120;
    const days = 30;

    let monthlyLiters = numberOfPeople * baseline * days;

    const climateFactor = await getClimateFactor(location);

    monthlyLiters *= climateFactor;

    const monthlyUnits = monthlyLiters / 1000;

    return {
        monthlyLiters: Math.round(monthlyLiters),
        monthlyUnits: Math.round(monthlyUnits * 100) / 100
    };
}

module.exports = estimateUsage;

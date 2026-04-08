const generateSavingTips = (priorityArea) => {
    const tips = {
        Bathroom: [
            "Turn off the tap while brushing or shaving",
            "Install low-flow showerheads and dual-flush toilets",
            "Fix leaking taps and toilet flush leaks immediately"
        ],
        Kitchen: [
            "Wash fruits and vegetables in a filled bowl instead of running water",
            "Operate dishwasher only with full load",
            "Reuse RO or vegetable wash water for cleaning floors"
        ],
        Garden: [
            "Water plants during early morning or late evening",
            "Install drip irrigation instead of hose watering",
            "Use rainwater harvesting for irrigation"
        ]
    };

    return tips[priorityArea] || ["Practice general water conservation habits daily"];
};

module.exports = { generateSavingTips };
module.exports = {
    list: async (req, res) => {
        res.json({ items: [], total: 0 });
    },
    detail: async (req, res) => {
        res.json({ id: req.params.id });
    },
    create: async (req, res) => {
        res.status(201).json({ id: 'temp-id', ...req.body });
    },
    update: async (req, res) => {
        res.json({ id: req.params.id, ...req.body });
    },
    remove: async (req, res) => {
        res.status(204).end();
    },
};



const app = require('./app')
const db = require('./models')

require('dotenv').config()

const PORT = process.env.PORT || 3000

async function startServer() {
    try {
        await db.sequelize.authenticate()
        console.log('Database connection OK')
        await db.sequelize.sync({ alter: true })
        console.log('Database schema synced with models')
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`)
        })
    } catch (error) {
        console.error('Failed to start server:', error)
        process.exit(1)
    }
}

startServer()
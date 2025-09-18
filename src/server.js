import express from 'express'

const app = express();
app.use(express.json())
const pacientes = [];
app.post('/pacientes', (req, res)=>{
    
    pacientes.push(req.body)
    res.status(201).json(req.body)
})

app.get('/pacientes', (req, res)=> {
    res.status(200).json(pacientes)
    res.send("Deu certo")
})

app.listen(3500)
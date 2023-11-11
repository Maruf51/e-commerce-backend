const express = require('express')
const app = express()
const mongoose = require('mongoose')
const cors = require('cors')
const bodyParser = require('body-parser')
const ImageKit = require("imagekit");
const mongoDB = 'mongodb+srv://maruf:Noor62427@cluster0.9kgb9ka.mongodb.net/e-commerce'
const productModel = require('./models/product')

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }));

mongoose.connect(mongoDB)





app.get('/', (req, res) => {
    res.send('Server is running!')
})

app.post('/upload-product', (req, res) => {
    const body = req.body
    const data = body.data
    const offset = body.offset
    const limit = body.limit

    try {
        productModel({...data}).save()
        .then(createResult => {
            productModel.find()
            .sort({updatedAt:-1})
            .limit(offset + limit)
            .then(result => {
                let allLoaded = false
                if(result.length < 10) {
                    allLoaded = true
                }
                else {
                    allLoaded = false
                }
                res.send({status: 'success', data: result, allLoaded: allLoaded})
            })
        })
    } catch (error) {
        res.status(502)
        .send({message: error.message || 'Database Error', status: 'error'})
    }
})

app.post('/products-list', (req, res) => {
    const data = req.body
    const offset = data.offset || 0
    const limit = data.limit || 10
    const sortCategory = data.sortCategory || 'all'
    const search = data.search || ''
    const catSearch = data.catSearch || ''
    const discountRange = data.discountRange || '100'
    // console.log(sortCategory, catSearch)

    try {
        if(search || sortCategory !== 'all' || catSearch || discountRange !== '100') {
            productModel.find()
            .sort({updatedAt:-1})
            .then(result => {
                if(search) {
                    const newData = result.filter(product => product.item_name.toLowerCase().includes(search.toLowerCase()))
                    res.send({status: 'success', data: newData, allLoaded: true})
                }
                else {
                    const categoryData = sortCategory === 'all' ? [...result] : result.filter(product => product.category === sortCategory)
                    const catSearchData = catSearch === '' ? [...categoryData] : categoryData.filter(product => product.item_name.toLowerCase().includes(catSearch.toLowerCase()))
                    const discountData = catSearchData.filter(product => parseInt(product.discount) <= parseInt(discountRange))
                    res.send({status: 'success', data: discountData, allLoaded: true})
                }
            })
        }
        else {
            productModel.find()
            .sort({updatedAt:-1})
            .skip(offset)
            .limit(limit)
            .then(result => {
                let allLoaded = false
                if(result.length < 10) {
                    allLoaded = true
                }
                else {
                    allLoaded = false
                }
                res.send({status: 'success', data: result, allLoaded: allLoaded})
            })
        }
    } catch (error) {
        res.status(502)
        .send({message: error.message || 'Database Error', status: 'error'})
    }
})

app.post('/delete-products', (req, res) => {
    const body = req.body
    const data = body.data
    const offset = body.offset
    const limit = body.limit

    let allIds = []
    for (let i = 0; i < data.length; i++) {
        allIds.push(data[i]._id)
    }
    
    try {
        productModel.deleteMany({ _id: { $in: allIds } })
        .then(deleteResult => {
            if(deleteResult.deletedCount !== 0) {
                productModel.find()
                .sort({updatedAt:-1})
                .limit(offset + limit)
                .then(result => {
                    let allLoaded = false
                    if(result.length < 10) {
                        allLoaded = true
                    }
                    else {
                        allLoaded = false
                    }
                    res.send({status: 'success', data: result, allLoaded: allLoaded, deletedCount: deleteResult.deletedCount})
                })
            }
        })
    } catch (error) {
        res.status(502)
        .send({message: error.message || 'Database Error', status: 'error'})
    }
})

app.post('/update-product', (req, res) => {
    const body = req.body
    const data = body.data
    const newData = {...data}
    delete newData._id
    const offset = body.offset
    const limit = body.limit
    try {
        productModel.findByIdAndUpdate({_id: data._id},{...newData})
        .then(updateResult => {
            if(updateResult?._id) {
                productModel.find()
                .sort({updatedAt:-1})
                .limit(offset + limit)
                .then(result => {
                    let allLoaded = false
                    if(result.length < 10) {
                        allLoaded = true
                    }
                    else {
                        allLoaded = false
                    }
                    res.send({status: 'success', data: result, allLoaded: allLoaded})
                })
            }
        })
        .catch(
            (error) => {
                res.status(502)
                .send({message: error.message || 'Database Error', status: 'error'})
            }
        )
    } catch (error) {
        res.status(502)
        .send({message: error.message || 'Database Error', status: 'error'})
    }
})


app.listen(5000, () => {
    console.log('server running')
})
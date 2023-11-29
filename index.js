const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// middleware 
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bm0qnz4.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();


        const articleCollection = client.db("newspaperDB").collection("articles");
        const userCollection = client.db("newspaperDB").collection("users");
        const publisherCollection = client.db("newspaperDB").collection("publishers");




        // admin verify middleware
        //TODO:use decoded(from jwt) instead of params/body to secure route.
        // const verifyAdmin = async (res, req, next) => {
        //     const email = req.body.email;
        //     const query = { email: email };
        //     const user = await userCollection.findOne(query);
        //     if (!(user.role === "admin")) {
        //         return res.status(403).send({ message: "forbidden access" });
        //     }
        //     next();
        // }




        // articles collection - API 
        app.get("/articles", async (req, res) => {
            const result = await articleCollection.find().toArray();
            res.send(result);
        })

        app.get("/articles/details/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await articleCollection.find(query).toArray();
            res.send(result);
        })

        app.post("/articles", async (req, res) => {
            const article = req.body;
            const result = await articleCollection.insertOne(article);
            res.send(result);
        })

        app.patch("/articles/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateArticle = {
                $set: {
                    status: "approved",
                }
            };
            const result = await articleCollection.updateOne(filter, updateArticle);
            res.send(result);
        })


        // users collection - API 
        app.get("/users", async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        })

        app.get("/users/admin/:email", async (req, res) => {
            const email = req.params.email;
            // TODO: jwt security ...
            const query = { email: email };
            const user = await userCollection.findOne(query);
            // console.log(user);//img loading problem
            let admin = true;
            if (user) {
                admin = (user?.role === "admin");
            }
            res.send({ admin });
        })

        app.post("/users", async (req, res) => {
            const user = req.body;
            // to stop data insert in db for already existing user
            const query = { email: user.email };
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: "user already exist", insertedId: null });
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        })

        app.patch("/users/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateUser = {
                $set: {
                    role: "admin",
                },
            }
            const result = await userCollection.updateOne(filter, updateUser);
            res.send(result);
        })

        app.delete("/users/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await userCollection.deleteOne(query);
            res.send(result);
        })

        // pubisher collection - API 
        app.get("/publishers", async (req, res) => {
            const pubishers = await publisherCollection.find().toArray();
            res.send(pubishers);
        })

        app.post("/publishers", async (req, res) => {
            const pubisher = req.body;
            const result = await publisherCollection.insertOne(pubisher);
            res.send(result);
        })


        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get("/", (req, res) => {
    res.send("newspaper is running>>>>");
})

app.listen(port, () => {
    console.log(`Newspaper is running on port: ${port}`);
})
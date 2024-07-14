const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();

app.use(express.json());
app.use(cors());
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.omgilvs.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
    const userCollection = client.db("fb").collection("userCollection");
    const postCollection = client.db("fb").collection("postCollection");

    app.get("/", (req, res) => {
      res.send("test");
    });

    app.post("/user", async (req, res) => {
      const userDetails = req.body;
      const isHave = await userCollection.findOne({ email: userDetails.email });
      if (!isHave) {
        const result = await userCollection.insertOne(userDetails);
        return res.send(result);
      }
      return res.send({ acknowledged: false });
    });

    app.post("/post", async (req, res) => {
      const data = req.body;
      const result = await postCollection.insertOne(data);
      res.send(result);
    });

    app.get("/post", async (req, res) => {
      const result = await postCollection.find().sort({ time: -1 }).toArray();
      res.send(result);
    });

    app.delete("/post/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await postCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/likeunlike/:postid", async (req, res) => {
      const postId = req.params.postid;
      const { email } = req.body;
      const isLiked = req.query.like === "true";
      const query = { _id: new ObjectId(postId) };
      let updateDoc;
      if (isLiked) {
        updateDoc = { $addToSet: { Likes: email } };
      } else {
        updateDoc = { $pull: { Likes: email } };
      }
      const result = await postCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    app.post("/comment/:postid", async (req, res) => {
      const postId = req.params.postid;
      const query = { _id: new ObjectId(postId) };
      const data = req.body;
      const updateDoc = {
        $push: { comments: data },
      };
      const result = await postCollection.updateOne(query, updateDoc);
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => console.log("server is running"));

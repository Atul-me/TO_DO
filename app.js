const mongoose = require('mongoose');
const express = require('express');
const _ = require('lodash');
require('dotenv').config();


const app = express();
const PORT = process.env.PORT || 3000;

mongoose.set('strictQuery',false);

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("Connected to Database");
}).catch((err) => {
    console.log("Not Connected to Database ERROR! ", err);
});

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist wertyhujkl!"
});

const item2 = new Item({
    name: "Hit the +wertyui button to add a new item."
});

const item3 = new Item({
    name: "<-- Hit this sdfghnjkto delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", async function (req, res) {
    const foundItems = await Item.find({});
    try {
        if (foundItems.length === 0) {
            await Item.insertMany(defaultItems);
            res.redirect("/");
        } else {
            res.render("list", { listTitle: "Today", newListItems: foundItems });
        }
    } catch (err) {
        console.error("Error finding items:", err);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/:customListName", async function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    try {
        const foundList = await List.findOne({ name: customListName });

        if (!foundList) {
            const list = new List({
                name: customListName,
                items: defaultItems
            });

            await list.save();
            res.redirect("/" + customListName);
        } else {
            res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
        }
    } catch (err) {
        console.error("Error:", err);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/", async function (req, res) {
    console.log(" req lsir ", req.body);
    const itemName = req.body.newItem;
    const listName = req.body.list[0];
    const item = new Item({
        name: itemName
    });
    await item.save();

    try {
        if (listName === "Today") {
            await item.save();
            res.redirect("/");
        } else {
            const foundList = await List.findOne({ name: listName });

            if (!foundList) {
                console.error("List not found:", listName);
                res.status(404).send("List not found");
            } else {
                foundList.items.push(item);
                await foundList.save();
                res.redirect("/" + listName);
            }
        }
    } catch (err) {
        console.error("Error saving item:", err);
        res.status(500).send("Internal Server Error");
    }
});


app.post("/delete", async function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    // console.log("checkedItemId",req.body);
    const data = await Item.findByIdAndDelete(checkedItemId);

    const del = await List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } });


    try {
        if (listName === "Today") {
            await Item.findByIdAndRemove(checkedItemId);
            console.log("Successfully deleted checked item.");
            res.redirect("/");
        } else {
            await List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } });
            res.redirect("/" + listName);
        }
    } catch (err) {
        console.error("Error deleting checked item:", err);
        res.status(500).send("Internal Server Error");
    }
});

app.listen(PORT, function () {
    console.log("Server started on port");
});


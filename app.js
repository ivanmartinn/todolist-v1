const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

let port = process.env.PORT || 3000;
if (port == null || port == "") {
  port = 3000;
}

mongoose
  .connect(
    "mongodb+srv://ivan_martinn:Feliany96@cluster0.ixws3pd.mongodb.net/todolistDB"
  )
  .then(
    app.listen(port, function (err) {
      if (err) console.log("Error in server setup");
      console.log("Server listening on Port", port);
    })
  );

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const defaultItem = new Item({
  name: "Do something productive!",
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find()
    .then((items) => {
      if (items.length === 0) {
        defaultItem
          .save()
          .then((result) => {
            res.redirect("/");
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        res.render("list", {
          title: "Today",
          items: items,
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/:customListName", function (req, res) {
  const customListName = req.params.customListName.toLowerCase();
  const listDBName = _.capitalize(customListName);

  if (customListName === "today") {
    res.redirect("/");
    return;
  }

  const list = new List({
    name: listDBName,
    items: [defaultItem],
  });

  List.findOne({ name: listDBName })
    .then((result) => {
      if (!result) {
        list
          .save()
          .then((result) => {
            res.redirect("/" + customListName);
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        res.render("list", {
          title: result.name,
          items: result.items,
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.post("/", function (req, res) {
  const titleName = req.body.titleName.toLowerCase();
  const listDBName = _.capitalize(titleName);

  const item = new Item({
    name: req.body.newTodo,
  });

  if (titleName !== "today") {
    List.findOne({ name: listDBName })
      .then((result) => {
        if (!result) {
          // in case db is manually removed
          const list = new List({
            name: listDBName,
            items: [defaultItem, item],
          });
          list
            .save()
            .then((result) => {
              res.redirect("/" + titleName);
            })
            .catch((err) => {
              console.log(err);
            });
        } else {
          result.items.push(item);
          result
            .save()
            .then((result) => {
              res.redirect("/" + titleName);
            })
            .catch((err) => {
              console.log(err);
            });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    // save to item list
    item
      .save()
      .then((result) => {
        res.redirect("/");
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

app.post("/delete", function (req, res) {
  const itemId = req.body.checkbox;
  const titleName = req.body.titleName.toLowerCase();
  const listDBName = _.capitalize(titleName);

  if (titleName !== "today") {
    List.findOneAndUpdate(
      { name: listDBName },
      { $pull: { items: { _id: itemId } } }
    )
      .then((result) => {
        res.redirect("/" + titleName);
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    Item.findByIdAndRemove({ _id: itemId })
      .then((result) => {
        res.redirect("/");
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

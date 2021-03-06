function getDatabase() {
    return LocalStorage.openDatabaseSync("weight-tracker", "1.0", "StorageDatabase", 1000000);
}
function initialize() {
    var db = getDatabase();
    db.transaction(
                function(tx) {
                    tx.executeSql('CREATE TABLE IF NOT EXISTS weight(weight REAL, date DATE,userId INT)');
                    tx.executeSql('CREATE TABLE IF NOT EXISTS users(id INT, name TEXT)');
                });
}
function deleteHistory(){
    var db = getDatabase();
    db.transaction(
                function(tx) {
                    tx.executeSql('DELETE FROM weight');
                });
}

function setWeight(weigth, date,userId) {
    var db = getDatabase();
    var res = "";
    db.transaction(function(tx) {
        var rs = tx.executeSql('INSERT  INTO weight VALUES (?,?,?);', [weigth,date,userId]);
        if (rs.rowsAffected > 0) {
            res = "OK";
        } else {
            res = "Error";
        }
    }
    );
    // The function returns “OK” if it was successful, or “Error” if it wasn't
    return res;
}
function findLastWeigth(userId) {
    var db = getDatabase();
    var lastWeight =0
    db.transaction(function(tx) {
        var rs = tx.executeSql('SELECT * FROM weight WHERE userId=? ORDER BY date DESC;',[userId]);
        if(rs.rows.length>0){
            lastWeight=rs.rows.item(0).weight
        }
    }
    )
    return lastWeight;
}
function findLastDate(userId) {
    var db = getDatabase();
    var lastDate =0
    db.transaction(function(tx) {
        var rs = tx.executeSql('SELECT * FROM weight WHERE userId=? ORDER BY date DESC;',[userId]);
        if(rs.rows.length>0){
            lastDate=Qt.formatDate(rs.rows.item(0).date,Qt.SystemLocaleShortDate)
        }
    }
    )
    return lastDate;
}
function getModelOfWeight(userId){
    var db = getDatabase();
    var arr=[];
    db.transaction(function(tx) {
        var rs = tx.executeSql('SELECT * FROM weight WHERE userId=?  ORDER BY date',[userId]);
        for(var i =0;i < rs.rows.length;i++){
            arr.push(rs.rows.item(i));
        }
    }
    );
    return arr;
}

function getArrayWeightGenaral(userId) {
    var db = getDatabase();
    var res = "";
    var labels=[];
    var values=[];
    db.transaction(function(tx) {
        var rs = tx.executeSql('SELECT * FROM weight WHERE userId=?  ORDER BY date',[userId]);
        for(var i =0;i < rs.rows.length;i++){
            labels.push(Qt.formatDate(rs.rows.item(i).date,"dd.MM.yy"));
            values.push(rs.rows.item(i).weight);
        }
    }
    );
    if (labels.length<2){
        return "";
    }
    res = {
        labels: labels,
        datasets: [{
                fillColor: "rgba(62, 179, 79, 0.4)" ,
                strokeColor: Qt.darker( UbuntuColors.green),
                pointColor: "rgba(62, 179, 79, 1)",
                pointStrokeColor: Qt.darker( UbuntuColors.green),
                data: values
            }]
    }

    return res;
}
function checkDateExist(date,userId){
    var db = getDatabase();
    var res = false;
    db.transaction(function(tx) {
        var rs = tx.executeSql('SELECT * FROM weight WHERE date=? AND userId=?',[date,userId]);
        if(rs.rows.length){
            res=true;
        }
    }
    )
    return res;
}
function updateWeight(weigth, date,userId){
    var db = getDatabase();
    var res = "";
    db.transaction(function(tx) {
        var rs = tx.executeSql('UPDATE weight SET weight=? WHERE date=? AND userId=?;', [weigth,date,userId]);
        if (rs.rowsAffected > 0) {
            res = "OK";
        } else {
            res = "Error";
        }
    }
    );
    // The function returns “OK” if it was successful, or “Error” if it wasn't
    return res;
}
function deleteWeight( date,userId){
    var db = getDatabase();
    var res = "";
    db.transaction(function(tx) {
        var rs = tx.executeSql('DELETE FROM weight  WHERE date=? AND userId=?;', [date,userId]);
        if (rs.rowsAffected > 0) {
            res = "OK";
        } else {
            res = "Error";
        }
    }
    );
    // The function returns “OK” if it was successful, or “Error” if it wasn't
    return res;
}
function getMaxUserId(){
    var maxId=0;
    var db = getDatabase();
    db.transaction(function(tx) {
        var rs = tx.executeSql('SELECT MAX(id) AS id FROM users');
        if(rs.rows.item(0).id>0){
            maxId=rs.rows.item(0).id
        }
    }
    );
    return maxId;
}

function insertUser(userName){
    var db = getDatabase();
    var id=0;
    db.transaction(function(tx) {
        id=getMaxUserId()+1
        tx.executeSql('INSERT  INTO users VALUES (?,?);', [id,userName]);
    }
    );
    return id;
}

function getArrayUsers(){
    var db = getDatabase();
    var users=[];
    db.transaction(function(tx) {
        var rs = tx.executeSql('SELECT * FROM users');
        for(var i =0;i < rs.rows.length;i++){
            users.push([rs.rows.item(i).id,rs.rows.item(i).name]);
        }
    }
    );
    return users;
}
function getWeightDirectionFromLastTime (userId){
    var db = getDatabase();
    var wight=[];
    db.transaction(function(tx) {
        var qurey="SELECT weight FROM weight WHERE userId="+userId+"  ORDER BY date DESC LIMIT 2"
        var rs = tx.executeSql(qurey);
        for(var i =0;i < rs.rows.length;i++){
            wight.push((rs.rows.item(i).weight));

        }
    }
    );
    if(wight.length===0){
        return "-"
    }
    var sum = (wight[0]-wight[1]).toFixed(2);
    if(sum>0){
        return "u"
    }else if(sum<0){
        return "d"
    }else if(isNaN(sum)){
      return "-"
    }
    return "s"
}

function getWeightDirectionOnPeriod(period,userId){
    var db = getDatabase();
    var wight=[];
    var periodString ="";
    if (period === "lastWeek"){
        var today = new Date();
        var lastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
        periodString = ("( date <= '"+Qt.formatDate(today,"yyyy-MM-dd")+"' AND date >='"+Qt.formatDate(lastWeek,"yyyy-MM-dd")+"')")
    }else if(period === "lastMonth"){

    }

    db.transaction(function(tx) {
        var qurey="SELECT weight FROM weight WHERE userId="+userId+" AND "+periodString+" ORDER BY date"
        var rs = tx.executeSql(qurey);
        for(var i =0;i < rs.rows.length;i++){
            wight.push((rs.rows.item(i).weight));
        }
    }
    );
    var sum = (wight[wight.length-1]-wight[0]).toFixed(2);
    if(sum>0.1){
        return "up"
    }else if(sum<-0.1){
        return "down"
    }else{
      return "same"
    }

}

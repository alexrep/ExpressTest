const promisify = (fn)=> {
  return new Promise((resolve, reject) => {
    fn((err, res)=>{
      if (err) {
        return reject(err);
      }
      return resolve(res);
    })
  })
};


module.exports = class EventDao{
  constructor(db){
    this.db =  db;
    this.eventCollection = db.collection('events')
  }

  saveEvents(events){
    return promisify((cb)=> this.eventCollection.insert(events,cb))
  }

  devicesByDate({start = 0, end}){
    end = end || (new Date()).getTime();
    const pipeline = [
      {
        $match: {
          timestamp:{
            $lt: parseInt(end),
            $gt: parseInt(start)
          }
        }
      },
      {
        $group: {
          _id:  {
            year:{$year:{ "$add": [ new Date(0), "$timestamp" ] }},
            month:{$month:{ "$add": [ new Date(0), "$timestamp" ] }},
            day:{$dayOfMonth:{ "$add": [ new Date(0), "$timestamp" ] }}
          },
          uniqueCount: {$addToSet: "$device_id"}
        }
      },
      {
        $group: { _id: '$_id', totalSize: { $sum: { $size: "$uniqueCount"}}}
      }
    ];
    return promisify((cb)=> this.eventCollection.aggregate(pipeline, cb));
  }

  export({deviceId}){
    return promisify((cb)=> this.eventCollection.find({device_id: parseInt(deviceId)}).sort({timestamp: 1}).toArray(cb));
  }

  async byLevel({start = 0, end}){
    end = end || (new Date()).getTime();

    const sharedStages = [
      {
        $group: {
          _id: '$device_id',
          installed: {$min: "$timestamp"},
          level_name: {$addToSet: "$level_name"}
        }
      },
      {
        $match: {
          installed:{
            $lt: parseInt(end),
            $gt: parseInt(start)
          }
        }
      }
    ];

    const countPipeline = sharedStages.concat([{ $count: "total" }]);

    const totalPromise = promisify((cb)=> this.eventCollection.aggregate(countPipeline,{allowDiskUse:true}, cb));

    const pipeline = sharedStages.concat([
      {
        $unwind: '$level_name'
      },
      {
        $project: {
          level_name: 1,
          type: {$type: "$level_name" }

        }
      },
      {
        $match: {
          type: {
            $in : ["int", "long"]
          }
        }
      },
      {
        $group: { _id: "$level_name", count:  { $sum:1 } }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const levelPromise =  promisify((cb)=> this.eventCollection.aggregate(pipeline, {allowDiskUse:true}, cb));
    return Promise.all([totalPromise,levelPromise]).then(([[totalCounts], byLevel]) =>{
      if (totalCounts){
        return byLevel.map(({_id, count})=>{
          return {count, levelName: _id, percent: count/totalCounts.total }
        })
      } else {
        return {}
      }
    })
  }
};
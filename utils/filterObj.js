const filterObj = (obj,...field)=>{
    const newObj = {}

    if(Object.keys(obj).forEach((key)=>{
        if(field.includes(key)){
            newObj[key] = obj[key]
        }
    })){

    }
    return newObj
}

module.exports = filterObj
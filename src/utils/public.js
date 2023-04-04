const dateFormat = (dateTime) => {
    const t = new Date(dateTime);
    const format = 'Y-m-d h:i:s';
    const year = t.getFullYear();
    const month = t.getMonth() + 1;
    const day = t.getDate();
    const hours = t.getHours();
    const minutes = t.getMinutes();
    const seconds = t.getSeconds();
    const hash = {
        'Y': year,
        'm': month>=10?month:`0${month}`,
        'd': day>=10?day:`0${day}`,
        'h': hours>=10?hours:`0${hours}`,
        'i': minutes>=10?minutes:`0${minutes}`,
        's': seconds>=10?seconds:`0${seconds}`
    };
    return format.replace(/\w/g, o => {
        return hash[o]
    })
}


export default {
    dateFormat,

};
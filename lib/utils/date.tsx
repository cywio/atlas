import moment from 'moment';
import * as timeago from 'timeago.js';

export function dateFormat(dateTime: Date) {
    let formated = timeago.format(dateTime)
    const now = moment(new Date());
    const then = moment(dateTime);
    const diff = now.diff(then, 'minutes');
    if(diff > 60)
        formated = then.local().format('DD/MM/YYYY hh:mm:ss A');
	return formated;
}
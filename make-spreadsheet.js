const data = require('fs').readFileSync('./full_questions.csv', 'utf-8').trim().split(/\r?\n/).map(l => l.split(','));

function createVariants(inp) {
    // start by converting all optional groups to paren groups
    let answer =  ('(' + inp + ')')
        .replace(/[a-z]/g, v => `(/${v.toUpperCase()})`)
        .replace(/\*/g, '(/*)')
        .replace(/\+/g, '(/ )')
        .replace(/\[/g, '(/')
        .replace(/\]/g, ')')
        ;

    // we start with one processing group of just the full answer
    let output = [{ state: 0, value: answer }];

    // and at a frame cost of 0.
    let frames = 0;

    // then we loop through the output repeatedly
    for (let i=0; i<output.length; ++i) {
        const data = output[i];
        if (data.state === 2) continue; // entry is finished, we can ignore it.
        // we found a group that needs processing, so we'll spend a frame doing that.
        frames += 1;

        // if this entry is processing, but there's nothing left to process
        // then we spend this frame just to mark it as complete
        if (data.state === 1 && !data.value.includes('(')) {
            // mark the entry as finished
            data.state = 2;
            // and return to the start of the loop.
            i = -1;
            continue;
        }

        // find offset to the next paren group
        let start = data.value.indexOf('(') + 1;
        // get full value before the paren group
        let prefix = data.value.slice(0, start - 1);
        // number of nested parens that have been found
        let nested = 0;
        // store output
        let result = [];
        // loop through from the start of the paren group to the end of the string
        let j;
        for (j=start; j<data.value.length; ++j) {
            // add a nested level for every open paren found
            if (data.value[j] === '(') { nested += 1; continue; }
            // close a nested paren group
            else if (data.value[j] === ')' && nested) { nested -= 1; continue; }
            // if we reach the outer paren group, exit loop
            else if (data.value[j] === ')') break;
            // if we're currently reading through a nested paren we should skip ahead
            if (nested) continue;
            // otherwise, if we're not splitting the current group, keep splitting
            if (data.value[j] !== '/') continue;
            // add the previous part of the group split
            result.push(data.value.slice(start, j));
            // and set the next split to start here
            start = j + 1;
        }
        // we reached the end, create the suffix for everything outside of the paren group
        const suffix = data.value.slice(j + 1);
        // and add the last portion of the capture group
        result.push(data.value.slice(start, j));
        // then replace the current value we're processing with the list of results!
        output.splice(i, 1, ...result.map(value => ({ state: 1, value: prefix + value + suffix })));
        // and return to the start of the loop.
        i = -1;
    }

    return {
        cost: frames,
        answers: output.map(o => o.value)
    }
}

// now loop through each question from the csv
for (const line of data) {
    // extract the answers
    const lineanswers = line.slice(12+3);
    const lengths = [];
    
    // we will always spend at least 1 frame validating
    let frames = 0;

    // then we check each possible answer
    for (let n=11; n>=0; --n) {
        // add 1 frame per answer even if its empty
        frames += 1;
        // then skip to next if this answer is unused
        if (!lineanswers[n]) continue;
        // create a list of all valid variants for this answer
        const { cost } = createVariants(lineanswers[n]);
        frames += cost;
        // add to the spreadsheet
        lengths[n * 2 + 1] = String(frames);
        lengths[n * 2] = lineanswers[n];
    }


    // is this a numeric question?
    if (/^\d+$/.test(lineanswers[0])) {
        // yes - if so we can just copy the answer lengths since you cant do partials of numbers
        //const copy = result.slice(0);
        lengths.unshift(-1, -1);
    } else {
        // the partial answers will always check ALL possible answers, and not stop until the end
        let fullpass = 0;
        for (let n=11; n>=0; --n) {
            // so add 1 per frame
            fullpass += 1;
            // skip ahead on unused answers
            if (!lineanswers[n]) continue;
            const { cost } = createVariants(lineanswers[n]);
            // then add the cost of creating the variants.
            fullpass += cost;
        }
        // add full pass validation costs to the spreadsheet
        lengths.unshift(
            // 2 frames overhead for doing second pass validation
            String(frames + fullpass + 2),
            // and 1 more frame for doing third pass
            String(frames + fullpass + fullpass + 3)
        )
    }

    const prefix = line.slice(0,3);
    line.splice(0, 10000);
    line.push(...prefix, ...lengths);
}

// print out our new CSV
for (const line of data) {
    console.log(line.join(','));
}

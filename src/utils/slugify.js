// Domain se exact tumhare format wala slug banata hai:
// 1st: techcrunch.com -> 2nd: techcrunch101.com -> 3rd: techcrunch102.com
const injectNumberBeforeFirstDot = (domain, num) => {
    const clean = String(domain).trim().toLowerCase();
    const firstDotIndex = clean.indexOf('.');
    if (firstDotIndex === -1) {
        return `${clean}${num}`;
    }
    const namePart = clean.slice(0, firstDotIndex);
    const tldPart = clean.slice(firstDotIndex); // e.g. '.com' or '.co.in'
    return `${namePart}${num}${tldPart}`;
};

const generateDomainSlug = async (Model, domain, reservedSet = null) => {
    const baseSlug = String(domain).trim().toLowerCase();
    let candidateSlug = baseSlug;
    let counter = 101;

    while (true) {
        const inMemoryReserved = reservedSet ? reservedSet.has(candidateSlug) : false;
        const existsInDb = inMemoryReserved ? true : await Model.exists({ slug: candidateSlug });

        if (!existsInDb) {
            if (reservedSet) reservedSet.add(candidateSlug);
            return candidateSlug;
        }

        candidateSlug = injectNumberBeforeFirstDot(baseSlug, counter);
        counter++;
    }
};

// Title se clean slug (Press Release me jab outletDomain null ho)
const generateTitleSlug = async (Model, title) => {
    const baseSlug = String(title || 'press-release')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);

    let candidateSlug = baseSlug;
    let counter = 101;

    while (true) {
        const existsInDb = await Model.exists({ slug: candidateSlug });
        if (!existsInDb) {
            return candidateSlug;
        }
        candidateSlug = `${baseSlug}-${counter}`;
        counter++;
    }
};

module.exports = {
    injectNumberBeforeFirstDot,
    generateDomainSlug,
    generateTitleSlug
};
const reducer = (state, action) => {
    switch (action.type) {
        case 'SET_SITEMGR':
            return { ...state, siteApi: action.payload };
        case 'REFRESH_LIST':
            return { ...state, refreshList: action.payload };

        // //accounts
        // case 'LOAD_ALLACCOUNTS':
        //     return { ...state, allaccountsState: 'LOAD_ALLACCOUNTS' };
        //
        // case 'SET_ALLACCOUNTS':
        //     return { ...state, allAccounts: action.payload, allaccountsState: 'READY' };
        //
        // case 'ALLACCOUNTS_ERROR':
        //     return { ...state, allAccounts: null, allaccountsState: 'ERROR' };

        default:
            throw new Error(`Unknown type: ${action.type}`);
    }
};
export default reducer

const reducer = (state, action) => {
    switch (action.type) {
        case 'SET_SITEMGR':
            return { ...state, siteApi: action.payload };
        case 'REFRESH_LIST':
            return { ...state, refreshList: action.payload };
        case 'SET_STATUS':
            return { ...state, publishStatus: action.payload };

        default:
            throw new Error(`Unknown type: ${action.type}`);
    }
};
export default reducer

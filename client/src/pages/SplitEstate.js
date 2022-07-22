import React, { Component } from "react";
import EstateFormat from "../components/EstateFormat";
import { Context } from "../Context";

class SplitEstate extends Component{
    state = {web3:null, accounts:null, contract:null,list:[],id:null};

    static contextType = Context

    componentDidMount = async () => {
        this.setState({web3:this.props.web3, accounts:this.props.accounts, contract: this.props.contract});
    };

    createForm = async() => {
        let num = parseInt(document.getElementById("numOfNew").value);
        console.log(num);
        let id = document.getElementById("splitId").value;
        let list = new Array(num);
        list.fill(0);
        await this.setState({id:id, list:list});
        console.log(this.state.list,this.state.id);
    }
    page = () => {
        if(this.state.id === null){
            return <div>送出後建立表單</div>
        }
        return (
            <div id="newEstate">
                <h3>輸入新的土地</h3>
                {
                    this.state.list.map((obj,i) => {
                        return(
                        <React.Fragment key={i}>
                        <form id={"splitForm" + i}>
                        <label>PMNO</label><br />
                        <input type="text" id={"pmno"+i} placeholder="4位數字" size="10"></input><br />
                        <label>PCNO</label><br />
                        <input type="text" id={"pcno"+i} placeholder="4位數字" size="10"></input><br />
                        <label>SCNO</label><br />
                        <input type="text" id={"scno"+i} placeholder="4位數字" size="10"></input><br />
                        <label>PointList</label><br />
                        <input type="text" id={"pointList"+i} placeholder="[x1,y1],[x2,y2]..." size="40"></input><br />
                        <hr />
                        </form>
                        </React.Fragment>
                        )
                    })
                }
                        <form id="fund">
                        <label>County</label><br />
                        <input type="text" id={"county"} placeholder="taipei" size="10"></input><br />
                        <label>Township</label><br />
                        <input type="text" id={"townShip"} placeholder="2位數字" size="10"></input><br />
                        <label>記錄日期</label><br />
                        <input type="text" id={"begD"} placeholder="20200217" size="10"></input><br />
                        <button type="button" onClick={this.splitEstate}>送出</button>
                        </form>
            </div>
        );
    };

    splitEstate = async () => {
        const {accounts,contract,id,list } = this.state;
        let formCom = document.getElementById("fund");
        let length = list.length;
        let newIdList = new Array(length);
        let newDataList = {sql:[],blockChain:[]};
        let polygonList = [];
        let parents = [id];

        for(let i = 0;i < length;i++){
            let formInd = document.getElementById("splitForm"+i);
            let dataFormat = EstateFormat.getSplitForm(formInd,formCom,parents);
            newIdList[i] = dataFormat.DFormat.id;
            newDataList.sql.push(dataFormat.DFormat.json);
            newDataList.blockChain.push(dataFormat.DFormat.blockChain);
            polygonList.push(dataFormat.PFormat.blockChain);
        }
    
        const backendServer = this.context.BackendServer + ":" + this.context.BackendServerPort
        let data = await fetch(backendServer + `/getOne?id=${id}`).then((response) => {
            return response.json();
        }).then((myjson) => {
            return myjson;
        });
        let date = newDataList.sql[0].data.endDate;
        console.log(data);
        data = data[0].EstateData;
        let data1 = JSON.parse(data);
        data1.data.endDate = date;
        data1.data.children = newIdList;
        data = JSON.stringify(data1);

        var operationID = 0
        await fetch(backendServer + `/operation_id?operation_type=${this.context.Operation.Splite}`)
        .then(response => response.json())
        .then(json => operationID = json.insertId)

        await contract.methods.deleteEst(
            data1.id,
            data1.data.begDate,
            data1.data.endDate,
            operationID,
            this.context.Operation.Splite,
        ).send({
            from: accounts[0],
            gas: 100000000
        });

        await contract.methods.split(
            [id],
            newIdList,
            newDataList.blockChain,
            polygonList,
            length,
            1,
            operationID,
            this.context.Operation.Splite,
        ).send({
            from:accounts[0],
            gas: 100000000
        });
        console.log("split!");
    }

    render(){
        if(!this.state.web3){
            return <h3>Fuxx</h3>
        }
        return (
            <div id="split" style={{
                paddingTop: '20px',
                paddingLeft: '20px',
                paddingBottom: '20px',
                boxSizing: 'content-box',
              }}>
                <form id="preproc">
                    <label>輸入被分割土地的ID</label><br />
                    <input type="text" size="30" id="splitId"></input><br />
                    <label>分割土地筆數</label><br />
                    <input type="text" size="10" id="numOfNew"></input><br />
                    <button type="button" onClick={this.createForm}>送出</button>
                </form>
                {
                    this.page()
                }
                <div>
                    <svg width={700} height={300} border="1px">
                    </svg>
                </div>
            </div>
        );
    }
}

export default SplitEstate;

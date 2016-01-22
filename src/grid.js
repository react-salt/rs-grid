import React, { Component } from 'react';
import { setClass } from 'cat-util';
import _ from 'lodash';
import GridHead from './grid/gridhead.js';
import GridBody from './grid/gridbody.js';
import NavHeader from './nav/navheader.js';
import NavFooter from './nav/navfooter.js';

export default class Grid extends Component {
  static propTypes = {
    columns: React.PropTypes.array, // 单元格定义
    rows: React.PropTypes.array, // 行特殊定义
    dataList: React.PropTypes.array,  // 数据
    pages: React.PropTypes.oneOfType([
        React.PropTypes.object,
        React.PropTypes.bool
    ]),  // 分页相关设定
    hasFooter: React.PropTypes.bool,
    renderKey: React.PropTypes.string,  // grid数据默认采用的key
    selection: React.PropTypes.oneOfType([
      React.PropTypes.array,
      React.PropTypes.bool,
    ]), // 全选相关功能
    enableFilter: React.PropTypes.bool, // 数据过滤相关功能
    myTableStyle: React.PropTypes.array,  // 内置风格
    myHeadStyle: React.PropTypes.string,  // 内置头部风格
    className: React.PropTypes.string,  // 自定义类名
    divStyle: React.PropTypes.object, // 彻底自定义样式
    prefixName: React.PropTypes.string // 前缀
  }

  static defaultProps = {
    columns: [],
    rows: [],
    dataList: [],
    pages: false,
    hasFooter: true,
    renderKey: 'id',
    selection: false,
    enableFilter: false,
    myTableStyle: ['bordered'],   // triped, condensed
    myHeadStyle: 'active',    // active, success, info, warning, danger
    className: 'table-responsive',
    divStyle: {},
    prefixName: 'cat'
  }

  _createState(props) {
    return {
      selectAll: false,
      selected: [],
      filterName: {
        label: '',
        value: ''
      },
      data: props.dataList.slice(),
      orderFunc: {
        key: '',
        func: ()=>{},
        forward: true
      }
    }
  }

  state = this._createState(this.props)

  // 接收新数据
  componentWillReceiveProps(nextProps) {
    this.setState(this._createState(nextProps));
  }

    // 选中处理
    _handleSelect = (value) => {
        let { selectAll, selected, data } = this.state,
            { renderKey } = this.props;
        if (value === '-1') {
            selectAll = !selectAll;
            if (selectAll) {
                selected = _.map(data, renderKey);
            } else {
                selected = [];
            }
        } else {
            let index = _.indexOf(selected, value);
            if (index < 0) {
                selected.push(value);
            } else {
                selected.splice(index, 1);
            }
            if (selected.length === data.length && selected.length !== 0) {
                selectAll = true;
            } else {
                selectAll = false;
            }
        }
        this.setState({
            selectAll: selectAll,
            selected: selected
        });
    }

  // 分页处理
  // 对外输出offset
  _updatePage(offset) {
    this.props.rerender(offset * this.props.pages.limit);
  }

  // 筛选处理
  _updateFilter(filter, key) {
    let { dataList, columns } = this.props;
    let { filterName } = this.state;
    filterName[key] = filter;
    let data = this._filterData(filterName, dataList, columns);

    this.setState({
      selectAll: false,
      selected: [],
      filterName: filterName,
      data: data
    });
  }

  // 过滤数据
  _filterData = (filterName, data, thead) => {
    if (filterName.value === '') {
      return data.slice();
    }

    let self = this;
    if (filterName.label === '') {
      // 针对所有数据进行过滤
      return data.filter((line) => {
        return thead.some((column) => {
          // 对每一行数据的每一列进行过滤
          return self._checkTd(filterName.value, line[column.name], column.renderer);
        });
      });
    } else {
      // 针对某一列数据进行过滤
      return data.filter((line) => {
        let renderer, name;
        for (let i = thead.length - 1; i >= 0; i --) {
          if (filterName.label === thead[i].label) {
            name = thead[i].name;
            renderer = thead[i].renderer;
            break;
          }
        }
        return self._checkTd(filterName.value, line[name], renderer);
      });
    }
  }

  // 判断单元格的筛选
  _checkTd = (value, tdValue, renderer) => {
    tdValue = renderer ? renderer(tdValue) : tdValue;
    // 此处默认以字符串格式对内容进行对比
    // TODO: 此处需要更优解
    if (tdValue === undefined || tdValue.toString().indexOf(value) < 0) {
      return false;
    }
    return true;
  }


    _updateOrder = (orderFunc) => {
        this.setState({
            orderFunc: orderFunc
        });
    }

  render() {
    let { columns, rows, dataList, pages, hasFooter, renderKey, selection, enableFilter, myTableStyle, myHeadStyle, className, divStyle, prefixName } = this.props;
    let { filterName, data, selectAll, selected, orderFunc } = this.state;
    let tableClassName = setClass(
        `${prefixName}-table`,
        `${prefixName}-table-hover`,
        myTableStyle.map((item) => `${prefixName}-table-${item}`),
        className
      );
    let orderedData = data.slice();

    if (orderFunc.key !== '') {
      orderedData.sort( (prev, next) => {
        let order = orderFunc.func(prev[orderFunc.key], next[orderFunc.key]);
        return orderFunc.forward ? order : !order;
      });
    }

    return (
      <div style={divStyle}>
        {
          (enableFilter || selection) &&
          <NavHeader
            prefixName={prefixName}
            enableFilter={enableFilter}
            filterName={filterName}
            updateFilter={this::this._updateFilter}
            columns={columns}

            selected={selected}
            enableSelection={selection}

          />
        }
        <table className={tableClassName}>
          <GridHead
            columns={columns}
            myStyle={this.props.myHeadStyle}

            enableSelection={selection}
            selectAll={selectAll}
            onSelect={this._handleSelect}
            orderFunc={orderFunc}
            updateOrder={this._updateOrder}
          />
          <GridBody
            dataList={orderedData}
            columns={columns}
            rows={rows}
            renderKey={renderKey}

            enableSelection={selection}
            selected={selected}
            onSelect={this._handleSelect}

          />
        </table>
        { (pages || hasFooter) &&
          <NavFooter
            prefixName={prefixName}
            update={this::this._updatePage}
            number={dataList.length}
            pages={pages}
          />
        }
      </div>
    );
  }
};

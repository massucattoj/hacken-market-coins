import React, { useState, useEffect } from 'react'
import { Table, Select, Image, Button, AutoComplete } from 'antd'
import axios from 'axios'
import { ColumnsType } from 'antd/es/table'
import { TablePaginationConfig } from 'antd/es/table/interface'

import './App.css'

interface Coin {
  name: string
  current_price: number
  circulating_supply: number
  image: string
  price_change_24h: number
  price_change_percentage_24h: number
}

interface AllCoins {
  id: string
  symbol: string
  name: string
}

export const App: React.FC = () => {
  const [coins, setCoins] = useState<Coin[]>([])
  const [currency, setCurrency] = useState<string>('USD')
  const [sortOrder, setSortOrder] = useState<string>('market_cap_desc')
  const [perPage, setPerPage] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState<string>('')
  const [searchString, setSearchString] = useState<string>('')
  const [allCoins, setAllCoins] = useState<AllCoins[]>([])
  const [filteredOptions, setFilteredOptions] = useState<AllCoins[]>([])

  useEffect(() => {
    const fetchAllCoins = async () => {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/coins/list',
      )
      setAllCoins(response.data)
    }
    fetchAllCoins()
  }, [])

  useEffect(() => {
    const fetchCoins = async () => {
      setLoading(true)
      try {
        const response = await axios.get(
          `https://api.coingecko.com/api/v3/coins/markets`,
          {
            params: {
              vs_currency: currency,
              order: sortOrder,
              per_page: perPage,
              page: currentPage,
              sparkline: false,
              ids: searchString,
            },
          },
        )
        setCoins(response.data)
        setError(null)
      } catch (error) {
        setError('Failed to fetch data. Wait a moment and please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchCoins()
  }, [currency, perPage, sortOrder, currentPage, searchString])

  const formatCurrency = (value: number, currency: string) => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency,
    })
  }

  const columns: ColumnsType<Coin> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: 12,
          }}
        >
          <Image src={record.image} alt={record.name} width={24} height={24} />

          {record.name}
        </div>
      ),
    },
    {
      title: 'Current Price',
      dataIndex: 'current_price',
      key: 'current_price',
      render: (price: number) => formatCurrency(price, currency),
    },
    {
      title: 'Circulating Supply',
      dataIndex: 'circulating_supply',
      key: 'circulating_supply',
      render: (supply: number) => supply.toLocaleString('en-US'),
    },
    {
      title: 'Price Change % (24h)',
      dataIndex: 'price_change_percentage_24h',
      key: 'price_change_percentage_24h',
      render: (_, record) => {
        const arrowColor =
          record.price_change_percentage_24h >= 0 ? 'green' : 'red'
        const arrowIcon = record.price_change_percentage_24h >= 0 ? '↑' : '↓'

        return (
          <span style={{ color: arrowColor }}>
            {arrowIcon}{' '}
            {Math.abs(record.price_change_percentage_24h).toFixed(2)}%
          </span>
        )
      },
    },
  ]

  const handleCurrencyChange = (value: string) => {
    setCurrency(value)
  }

  const handleSortOrderChange = (value: string) => {
    setSortOrder(
      value === 'market_cap_desc' ? 'market_cap_desc' : 'market_cap_asc',
    )
  }

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setCurrentPage(pagination.current ?? currentPage)
    setPerPage(pagination.pageSize ?? perPage)
  }

  const handleSearch = () => {
    const selectedCoin = allCoins.find(
      (coin) => coin.name.toLowerCase() === searchInput.toLowerCase(),
    )
    setSearchString(selectedCoin ? selectedCoin.id : '')
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearchString('')
    setFilteredOptions([])
  }

  const handleInputChange = (value: string) => {
    setSearchInput(value)

    if (value.trim()) {
      const filtered = allCoins.filter((coin) =>
        coin.name.toLowerCase().startsWith(value.toLowerCase()),
      )
      setFilteredOptions(filtered)
    } else {
      setFilteredOptions([])
    }
  }
  return (
    <div className="app-container">
      <div className="header">
        <span className="title">Coins & Markets</span>
      </div>

      <div className="table-options">
        <div className="controls">
          <Select
            value={currency}
            onChange={handleCurrencyChange}
            style={{ width: 120, marginRight: '16px' }}
            aria-label="Select currency"
          >
            <Select.Option value="USD">USD</Select.Option>
            <Select.Option value="EUR">EUR</Select.Option>
          </Select>

          <Select
            value={sortOrder}
            onChange={handleSortOrderChange}
            style={{ width: 180 }}
          >
            <Select.Option value="market_cap_desc">
              Market cap descending
            </Select.Option>
            <Select.Option value="market_cap_asc">
              Market cap ascending
            </Select.Option>
          </Select>
        </div>

        <div className="autocomplete-buttons">
          <AutoComplete
            value={searchInput}
            options={filteredOptions.map((coin) => ({
              value: coin.name,
            }))}
            onChange={handleInputChange}
            style={{ width: 300, marginRight: '16px' }}
            placeholder="Enter coin name"
          />

          <div>
            <Button
              type="primary"
              onClick={handleSearch}
              style={{ marginRight: '8px' }}
            >
              Search
            </Button>
            <Button type="default" onClick={handleClearSearch}>
              Clear
            </Button>
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={coins}
        rowKey={(record) => record.name}
        pagination={{
          current: currentPage,
          pageSize: perPage,
          showSizeChanger: true,
          pageSizeOptions: ['5', '10', '20', '50', '100'],
          total: 10000,
        }}
        onChange={handleTableChange}
        loading={loading}
      />

      {coins.length < 1 && error && (
        <div className="error-message">{error}</div>
      )}
    </div>
  )
}

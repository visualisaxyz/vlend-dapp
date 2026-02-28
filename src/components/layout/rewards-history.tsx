export default function RewardsHistory() {
  const rewardsData = [
    {
      epoch: 1,
      date: "19.05.2024",
      yield: 3.19933900000001,
    },
    {
      epoch: 2,
      date: "29.05.2024",
      yield: 11.6156446299997,
    },
    {
      epoch: 3,
      date: "08.06.2024",
      yield: 12.235449,
    },
    {
      epoch: 4,
      date: "18.06.2024",
      yield: 13.755576,
    },
    {
      epoch: 5,
      date: "28.06.2024",
      yield: 11.332985,
    },
    {
      epoch: 6,
      date: "08.07.2024",
      yield: 5.880692,
    },
    {
      epoch: 7,
      date: "18.07.2024",
      yield: 23.282729,
    },
    {
      epoch: 8,
      date: "28.07.2024",
      yield: 13.093386,
    },
    {
      epoch: 9,
      date: "07.08.2024",
      yield: 12.390195,
    },
    {
      epoch: 10,
      date: "17.08.2024",
      yield: 12.239349,
    },
    {
      epoch: 11,
      date: "27.08.2024",
      yield: 11.43624,
    },
    {
      epoch: 12,
      date: "06.09.2024",
      yield: 14.41426,
    },
    {
      epoch: 13,
      date: "16.09.2024",
      yield: 12.64516,
    },
    {
      epoch: 14,
      date: "26.09.2024",
      yield: 16.32426,
    },
    {
      epoch: 15,
      date: "06.10.2024",
      yield: 15.14567,
    },
    {
      epoch: 16,
      date: "16.10.2024",
      yield: 14.84567,
    },
    {
      epoch: 17,
      date: "26.10.2024",
      yield: 14.39124,
    },
    {
      epoch: 18,
      date: "05.11.2024",
      yield: 13.15124,
    },
    {
      epoch: 19,
      date: "15.11.2024",
      yield: 14.14124,
    },
    {
      epoch: 20,
      date: "25.11.2024",
      yield: 15.66912,
    },
    {
      epoch: 21,
      date: "05.12.2024",
      yield: 16.13412,
    },
    {
      epoch: 22,
      date: "15.12.2024",
      yield: 16.10412,
    },
    {
      epoch: 23,
      date: "25.12.2024",
      yield: 12.32342,
    },
    {
      epoch: 24,
      date: "04.01.2025",
      yield: 8.59841,
    },
    {
      epoch: 25,
      date: "14.01.2025",
      yield: 4.96841,
    },
    {
      epoch: 26,
      date: "24.01.2025",
      yield: 4.73343,
    },
    {
      epoch: 27,
      date: "04.02.2025",
      yield: 9.00781,
    },
    {
      epoch: 28,
      date: "14.02.2025",
      yield: 1.53343,
    },
    {
      epoch: 29,
      date: "24.02.2025",
      yield: 1.50343,
    },
    {
      epoch: 30,
      date: "05.03.2025",
      yield: 1.34043,
    },
    {
      epoch: 31,
      date: "15.03.2025",
      yield: 0.50013,
    },
    {
      epoch: 32,
      date: "25.03.2025",
      yield: 0.47013,
    },
    {
      epoch: 33,
      date: "04.04.2025",
      yield: 0.21013,
    },
    {
      epoch: 34,
      date: "14.04.2025",
      yield: 0.25213,
    },
    {
      epoch: 35,
      date: "04.05.2025",
      yield: 0.50623,
    },
  ]

  return (
    <div className="flex w-full flex-col items-center justify-center pb-2 pt-2 text-foreground">
      <div className="bg-primary flex w-full flex-row items-center justify-center rounded-t-lg bg-opacity-30 py-2 pl-4 pr-4 text-base">
        <div className="w-1/3 text-start md:w-1/5">Epoch</div>
        <div className="w-1/3 text-center md:w-1/5 md:text-start">
          Distribution Date
        </div>
        <div className="w-1/3 text-center md:w-1/5 md:text-start">
          Period Yield (WTAO)
        </div>
        <div className="hidden w-1/3 text-start md:flex md:w-1/5">
          To WTAO Stakers (WTAO)
        </div>
        <div className="hidden w-1/3 text-start md:flex md:w-1/5">
          To TBANK Stakers (WTAO)
        </div>
      </div>
      {rewardsData.map((reward, index) => (
        <div
          key={index}
          className={
            "flex w-full flex-row items-center justify-center bg-opacity-10 py-2 pl-4 text-base " +
            (index % 2 === 1 ? "bg-primary " : "") +
            (index === rewardsData.length - 1 ? "rounded-b-lg" : "")
          }
        >
          <div className="w-1/3 text-start md:w-1/5">{reward.epoch}</div>
          <div className="w-1/3 text-center md:w-1/5 md:text-start">
            {reward.date}
          </div>
          <div className="w-1/3 text-center md:w-1/5 md:text-start">
            {reward.yield.toFixed(2)}
          </div>
          <div className="hidden w-1/5 text-start md:flex">
            {(reward.yield * 0.8).toFixed(2)}
          </div>
          <div className="hidden w-1/5 text-start md:flex">
            {(reward.yield * 0.2).toFixed(2)}
          </div>
        </div>
      ))}
      <div className="flex w-full flex-row items-center justify-center bg-opacity-10 py-2 pl-4 text-base">
        <div className="w-1/3 text-start md:w-1/5">Total</div>
        <div className="w-1/3 text-center md:w-1/5 md:text-start"></div>
        <div className="w-1/3 text-center md:w-1/5 md:text-start">
          {
            //sum
            rewardsData.reduce((a, b) => a + b.yield, 0).toFixed(2)
          }
        </div>
        <div className="hidden w-1/5 text-start md:flex">
          {
            //sum
            rewardsData.reduce((a, b) => a + b.yield * 0.8, 0).toFixed(2)
          }
        </div>
        <div className="hidden w-1/5 text-start md:flex">
          {
            //sum
            rewardsData.reduce((a, b) => a + b.yield * 0.2 + 0.5, 0).toFixed(2)
          }
        </div>
      </div>
    </div>
  )
}

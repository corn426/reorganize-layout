/* 여기에 주어진 요구 사항을 충족 시키기 위한 코드를 작성 및 수정해 주세요. */
import "./Card.css";

function Card() {
  return (
    <li className="card--container" id="card1">
      <div className="header">
        <div className="card--tag">
          <span className="upload-date">2024-11-09</span>
        </div>
        <div className="card--tag">
          <span className="icon bookmark">
            <i className="fa fa-bookmark"></i>
          </span>
        </div>
      </div>
      <div className="card--content">
        <span className="title">Quick Brown Fox</span>
      </div>
      <div className="footer">
        <div className="card--tag">
          <span className="views">73</span>
          views
        </div>
      </div>
    </li>
  );
}
export default Card;

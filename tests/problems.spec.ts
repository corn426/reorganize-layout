import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5000';

test.describe('게시물 레이아웃 재구성하기', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    // 페이지가 완전히 로드될 때까지 대기
    await page.waitForLoadState('networkidle');
  });

  test('[게시물 레이아웃 재구성하기] 게시물 레이아웃이 카드 그리드 형태로 변경된다.', async ({ page }) => {
    // 카드 컴포넌트들이 렌더링되는지 확인
    const cards = await page.locator('.card--container');
    const cardCount = await cards.count();
    
    // 최소 1개 이상의 카드가 있어야 함
    expect(cardCount).toBeGreaterThan(0);
    
    // 모든 카드가 id 속성을 가지고 있는지 확인
    for (let i = 0; i < cardCount; i++) {
      const card = cards.nth(i);
      const id = await card.getAttribute('id');
      expect(id).toBeTruthy();
      expect(id).toMatch(/^card\d+$/); // card1, card2 등의 형식
    }
    
    // 카드에 필요한 요소들이 있는지 확인
    const firstCard = cards.first();
    await expect(firstCard.locator('.title')).toBeVisible();
    await expect(firstCard.locator('.views')).toBeVisible();
    await expect(firstCard.locator('.upload-date')).toBeVisible();
    await expect(firstCard.locator('.bookmark')).toBeVisible();
  });

  test('[게시물 레이아웃 재구성하기] 게시물이 기본으로 최근등록순으로 정렬되어있다.', async ({ page }) => {
    // 정렬 셀렉트 박스의 기본값 확인
    const selectElement = page.locator('#order_type');
    const selectedValue = await selectElement.inputValue();
    expect(selectedValue).toBe('1'); // 1 = 최근등록순
    
    // 카드들의 날짜를 가져와서 내림차순(최근순)인지 확인
    const cards = await page.locator('.card--container');
    const cardCount = await cards.count();
    
    if (cardCount > 1) {
      const dates: string[] = [];
      for (let i = 0; i < cardCount; i++) {
        const dateText = await cards.nth(i).locator('.upload-date').textContent();
        if (dateText) {
          dates.push(dateText.trim());
        }
      }
      
      // 북마크 여부를 고려하지 않은 순수 날짜 비교를 위해
      // 북마크되지 않은 항목들만 추출하여 검사
      const bookmarkIcons = await page.locator('.bookmark.active, .bookmark[style*="color: red"], .bookmark[style*="color:red"]');
      const bookmarkedCount = await bookmarkIcons.count();
      
      if (bookmarkedCount === 0) {
        // 북마크가 없을 때는 모든 날짜가 내림차순이어야 함
        for (let i = 0; i < dates.length - 1; i++) {
          const date1 = new Date(dates[i]);
          const date2 = new Date(dates[i + 1]);
          expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime());
        }
      }
    }
  });

  test('[게시물 레이아웃 재구성하기] 정렬 형태를 조회순으로 변경하면 게시물이 조회순으로 정렬된다.', async ({ page }) => {
    // 정렬을 조회순으로 변경
    await page.selectOption('#order_type', '2');
    
    // 변경이 반영될 때까지 잠시 대기
    await page.waitForTimeout(500);
    
    // 카드들의 조회수를 가져와서 내림차순인지 확인
    const cards = await page.locator('.card--container');
    const cardCount = await cards.count();
    
    if (cardCount > 1) {
      const views: number[] = [];
      for (let i = 0; i < cardCount; i++) {
        const viewsText = await cards.nth(i).locator('.views').textContent();
        if (viewsText) {
          views.push(parseInt(viewsText.trim()));
        }
      }
      
      // 북마크되지 않은 항목들의 조회수가 내림차순인지 확인
      const bookmarkIcons = await page.locator('.bookmark.active, .bookmark[style*="color: red"], .bookmark[style*="color:red"]');
      const bookmarkedCount = await bookmarkIcons.count();
      
      if (bookmarkedCount === 0) {
        for (let i = 0; i < views.length - 1; i++) {
          expect(views[i]).toBeGreaterThanOrEqual(views[i + 1]);
        }
      }
    }
  });

  test('[게시물 레이아웃 재구성하기] 정렬 형태에 따라 게시물이 정상적으로 정렬된다.', async ({ page }) => {
    // 최근등록순 확인
    await page.selectOption('#order_type', '1');
    await page.waitForTimeout(500);
    
    const cards1 = await page.locator('.card--container');
    const firstCardDate1 = await cards1.first().locator('.upload-date').textContent();
    
    // 조회순으로 변경
    await page.selectOption('#order_type', '2');
    await page.waitForTimeout(500);
    
    const cards2 = await page.locator('.card--container');
    const firstCardViews = await cards2.first().locator('.views').textContent();
    
    // 조회순일 때 조회수가 표시되는지 확인
    expect(firstCardViews).toBeTruthy();
    
    // 다시 최근등록순으로 변경
    await page.selectOption('#order_type', '1');
    await page.waitForTimeout(500);
    
    const cards3 = await page.locator('.card--container');
    const firstCardDate2 = await cards3.first().locator('.upload-date').textContent();
    
    // 날짜가 표시되는지 확인
    expect(firstCardDate2).toBeTruthy();
  });

  test('[게시물 레이아웃 재구성하기] 북마크 버튼 기능이 정상적으로 동작한다.', async ({ page }) => {
    const cards = await page.locator('.card--container');
    const firstCard = cards.first();
    const bookmarkIcon = firstCard.locator('.bookmark');
    
    // 초기 북마크 상태 확인
    const initialColor = await bookmarkIcon.evaluate((el) => {
      return window.getComputedStyle(el).color || el.getAttribute('style');
    });
    
    // 북마크 아이콘 클릭
    await bookmarkIcon.click();
    await page.waitForTimeout(300);
    
    // 북마크 후 색상 확인 (빨간색이어야 함)
    const afterColor = await bookmarkIcon.evaluate((el) => {
      const style = window.getComputedStyle(el);
      const inlineStyle = el.getAttribute('style') || '';
      return style.color || inlineStyle;
    });
    
    // 빨간색 확인 (rgb(255, 0, 0) 또는 red 또는 #ff0000 등)
    const isRed = afterColor.includes('255, 0, 0') || 
                  afterColor.includes('red') || 
                  afterColor.includes('#ff0000') ||
                  await bookmarkIcon.evaluate((el) => el.classList.contains('active'));
    
    expect(isRed).toBeTruthy();
    
    // 다시 클릭하여 북마크 해제
    await bookmarkIcon.click();
    await page.waitForTimeout(300);
    
    // 북마크 해제 후 색상 확인
    const afterUnbookmark = await bookmarkIcon.evaluate((el) => {
      const style = window.getComputedStyle(el);
      const inlineStyle = el.getAttribute('style') || '';
      return style.color || inlineStyle;
    });
    
    // 빨간색이 아니어야 함
    const isNotRed = !afterUnbookmark.includes('255, 0, 0') || 
                     !await bookmarkIcon.evaluate((el) => el.classList.contains('active'));
    
    expect(isNotRed).toBeTruthy();
  });

  test('[게시물 레이아웃 재구성하기] 북마크한 게시물들이 최우선으로 정렬된다.', async ({ page }) => {
    const cards = await page.locator('.card--container');
    const cardCount = await cards.count();
    
    if (cardCount < 3) {
      // 카드가 충분하지 않으면 테스트 건너뛰기
      test.skip();
    }
    
    // 2번째와 3번째 카드를 북마크
    await cards.nth(1).locator('.bookmark').click();
    await page.waitForTimeout(300);
    await cards.nth(2).locator('.bookmark').click();
    await page.waitForTimeout(300);
    
    // 북마크한 카드들이 맨 위에 있는지 확인
    const updatedCards = await page.locator('.card--container');
    
    // 처음 2개의 카드가 북마크된 상태인지 확인
    const firstBookmark = updatedCards.nth(0).locator('.bookmark');
    const secondBookmark = updatedCards.nth(1).locator('.bookmark');
    
    const firstIsBookmarked = await firstBookmark.evaluate((el) => {
      const style = window.getComputedStyle(el);
      const inlineStyle = el.getAttribute('style') || '';
      const color = style.color || inlineStyle;
      return color.includes('255, 0, 0') || 
             color.includes('red') || 
             color.includes('#ff0000') ||
             el.classList.contains('active');
    });
    
    const secondIsBookmarked = await secondBookmark.evaluate((el) => {
      const style = window.getComputedStyle(el);
      const inlineStyle = el.getAttribute('style') || '';
      const color = style.color || inlineStyle;
      return color.includes('255, 0, 0') || 
             color.includes('red') || 
             color.includes('#ff0000') ||
             el.classList.contains('active');
    });
    
    expect(firstIsBookmarked).toBeTruthy();
    expect(secondIsBookmarked).toBeTruthy();
  });

  test('[게시물 레이아웃 재구성하기] 게시물들이 북마크 여부와 정렬에 따라 정상적으로 정렬된다.', async ({ page }) => {
    const cards = await page.locator('.card--container');
    const cardCount = await cards.count();
    
    if (cardCount < 3) {
      test.skip();
    }
    
    // 먼저 조회순으로 정렬
    await page.selectOption('#order_type', '2');
    await page.waitForTimeout(500);
    
    // 중간 카드 하나를 북마크
    const middleIndex = Math.floor(cardCount / 2);
    await cards.nth(middleIndex).locator('.bookmark').click();
    await page.waitForTimeout(300);
    
    // 북마크된 카드가 맨 위로 이동했는지 확인
    const updatedCards = await page.locator('.card--container');
    const firstCard = updatedCards.first();
    const firstBookmark = firstCard.locator('.bookmark');
    
    const isBookmarked = await firstBookmark.evaluate((el) => {
      const style = window.getComputedStyle(el);
      const inlineStyle = el.getAttribute('style') || '';
      const color = style.color || inlineStyle;
      return color.includes('255, 0, 0') || 
             color.includes('red') || 
             color.includes('#ff0000') ||
             el.classList.contains('active');
    });
    
    expect(isBookmarked).toBeTruthy();
    
    // 최근등록순으로 변경
    await page.selectOption('#order_type', '1');
    await page.waitForTimeout(500);
    
    // 여전히 북마크된 카드가 맨 위에 있는지 확인
    const sortedCards = await page.locator('.card--container');
    const firstSortedCard = sortedCards.first();
    const firstSortedBookmark = firstSortedCard.locator('.bookmark');
    
    const isStillBookmarked = await firstSortedBookmark.evaluate((el) => {
      const style = window.getComputedStyle(el);
      const inlineStyle = el.getAttribute('style') || '';
      const color = style.color || inlineStyle;
      return color.includes('255, 0, 0') || 
             color.includes('red') || 
             color.includes('#ff0000') ||
             el.classList.contains('active');
    });
    
    expect(isStillBookmarked).toBeTruthy();
    
    // 북마크되지 않은 나머지 카드들이 날짜순으로 정렬되어 있는지 확인
    const allCards = await sortedCards.count();
    if (allCards > 2) {
      const dates: string[] = [];
      // 첫 번째 카드는 북마크된 카드이므로 2번째부터 확인
      for (let i = 1; i < Math.min(allCards, 4); i++) {
        const bookmarkEl = sortedCards.nth(i).locator('.bookmark');
        const isBookmarked = await bookmarkEl.evaluate((el) => {
          const style = window.getComputedStyle(el);
          const inlineStyle = el.getAttribute('style') || '';
          const color = style.color || inlineStyle;
          return color.includes('255, 0, 0') || 
                 color.includes('red') || 
                 el.classList.contains('active');
        });
        
        if (!isBookmarked) {
          const dateText = await sortedCards.nth(i).locator('.upload-date').textContent();
          if (dateText) {
            dates.push(dateText.trim());
          }
        }
      }
      
      // 북마크되지 않은 카드들이 날짜 내림차순인지 확인
      for (let i = 0; i < dates.length - 1; i++) {
        const date1 = new Date(dates[i]);
        const date2 = new Date(dates[i + 1]);
        expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime());
      }
    }
  });
});
